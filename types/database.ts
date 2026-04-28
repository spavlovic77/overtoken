export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key: string
  secret_hash: string
  usage_count: number
  max_usage: number
  is_active: boolean
  created_at: string
}

export interface VerificationLog {
  id: string
  api_key_id: string | null
  user_id: string | null
  status: 'valid' | 'invalid' | 'error'
  response_time_ms: number | null
  created_at: string
}

export interface UserQuota {
  id: string
  user_id: string
  verifications_today: number
  last_reset_date: string
  daily_limit: number
  created_at: string
}

export interface QuotaInfo {
  verifications_today: number
  daily_limit: number
  remaining: number
}

export interface VerificationResult {
  valid: boolean
  dic1: string
  dic2: string
  message: string
  reason?: string
}
