-- ============================================================
-- overtoken - Supabase Schema
-- Run this in the Supabase SQL Editor for the new project.
-- ============================================================

-- Profiles (synced from auth.users via trigger)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- API Keys
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  key TEXT NOT NULL UNIQUE,
  secret_hash TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_usage INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Verification logs
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User quotas (daily limit on UI verifications, resets at midnight CET)
CREATE TABLE public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  verifications_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_api_keys_key ON public.api_keys(key);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_verification_logs_api_key ON public.verification_logs(api_key_id);
CREATE INDEX idx_verification_logs_user ON public.verification_logs(user_id);
CREATE INDEX idx_verification_logs_created ON public.verification_logs(created_at);
CREATE INDEX idx_user_quotas_user ON public.user_quotas(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Atomic API-key usage increment
CREATE OR REPLACE FUNCTION public.increment_usage(key_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.api_keys
  SET usage_count = usage_count + 1
  WHERE id = key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get or create user UI quota (CET daily reset)
CREATE OR REPLACE FUNCTION public.get_or_create_quota(p_user_id UUID)
RETURNS TABLE (
  out_verifications_today INTEGER,
  out_daily_limit INTEGER,
  out_last_reset_date DATE
) AS $$
DECLARE
  v_cet_date DATE;
  v_record public.user_quotas%ROWTYPE;
BEGIN
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  SELECT * INTO v_record FROM public.user_quotas uq WHERE uq.user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_quotas (user_id, verifications_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 0, v_cet_date, 5)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    UPDATE public.user_quotas uq
    SET verifications_today = 0, last_reset_date = v_cet_date
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT v_record.verifications_today, v_record.daily_limit, v_record.last_reset_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment UI verification count and report exceeded flag
CREATE OR REPLACE FUNCTION public.increment_user_verification(p_user_id UUID)
RETURNS TABLE (
  out_verifications_today INTEGER,
  out_daily_limit INTEGER,
  out_quota_exceeded BOOLEAN
) AS $$
DECLARE
  v_cet_date DATE;
  v_record public.user_quotas%ROWTYPE;
BEGIN
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  SELECT * INTO v_record FROM public.user_quotas uq WHERE uq.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_quotas (user_id, verifications_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 1, v_cet_date, 5)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    UPDATE public.user_quotas uq
    SET verifications_today = 1, last_reset_date = v_cet_date
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  ELSE
    UPDATE public.user_quotas uq
    SET verifications_today = uq.verifications_today + 1
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT
    v_record.verifications_today,
    v_record.daily_limit,
    (v_record.verifications_today > v_record.daily_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own api_keys"
  ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api_keys"
  ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api_keys"
  ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api_keys"
  ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own verification_logs"
  ON public.verification_logs FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE api_keys.id = verification_logs.api_key_id
      AND api_keys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own quota"
  ON public.user_quotas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quota"
  ON public.user_quotas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quota"
  ON public.user_quotas FOR UPDATE USING (auth.uid() = user_id);
