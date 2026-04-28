import type { QuotaInfo } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function getUserQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaInfo | null> {
  const { data, error } = await supabase.rpc("get_or_create_quota", {
    p_user_id: userId,
  })

  if (error || !data || data.length === 0) {
    console.error("Error fetching quota:", error)
    return null
  }

  const quota = data[0]
  const verificationsToday =
    quota.out_verifications_today ?? quota.verifications_today ?? 0
  const dailyLimit = quota.out_daily_limit ?? quota.daily_limit ?? 5
  return {
    verifications_today: verificationsToday,
    daily_limit: dailyLimit,
    remaining: Math.max(0, dailyLimit - verificationsToday),
  }
}

export async function incrementUserVerification(
  supabase: SupabaseClient,
  userId: string
): Promise<{ quota: QuotaInfo; exceeded: boolean } | null> {
  const { data, error } = await supabase.rpc("increment_user_verification", {
    p_user_id: userId,
  })

  if (error || !data || data.length === 0) {
    console.error("Error incrementing verification:", error)
    return null
  }

  const result = data[0]
  const verificationsToday =
    result.out_verifications_today ?? result.verifications_today ?? 0
  const dailyLimit = result.out_daily_limit ?? result.daily_limit ?? 5
  const quotaExceeded =
    result.out_quota_exceeded ?? result.quota_exceeded ?? false
  return {
    quota: {
      verifications_today: verificationsToday,
      daily_limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - verificationsToday),
    },
    exceeded: quotaExceeded,
  }
}

export async function hasRemainingQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const quota = await getUserQuota(supabase, userId)
  if (!quota) return false
  return quota.remaining > 0
}

export function getCurrentCETDate(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Paris",
  })
}
