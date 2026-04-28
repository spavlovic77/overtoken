import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { incrementUserVerification } from "@/lib/quota"
import { verifySchema } from "@/lib/schemas"
import { verifyToken } from "@/lib/verify"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 })
  }

  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    )
  }

  const quotaResult = await incrementUserVerification(supabase, user.id)
  if (!quotaResult) {
    return NextResponse.json({ error: "Quota check failed" }, { status: 500 })
  }

  if (quotaResult.exceeded) {
    return NextResponse.json(
      {
        error: "Daily quota exceeded.",
        quota: {
          used: quotaResult.quota.verifications_today,
          limit: quotaResult.quota.daily_limit,
          remaining: quotaResult.quota.remaining,
        },
      },
      { status: 403 }
    )
  }

  const startTime = Date.now()
  const outcome = verifyToken(parsed.data)
  const responseTimeMs = Date.now() - startTime

  // Log via admin client so RLS doesn't block writes from the route
  const admin = createAdminClient()
  await admin.from("verification_logs").insert({
    user_id: user.id,
    status: outcome.valid ? "valid" : "invalid",
    response_time_ms: responseTimeMs,
  })

  return NextResponse.json({
    valid: outcome.valid,
    dic1: parsed.data.dic1,
    dic2: parsed.data.dic2,
    message: outcome.valid
      ? "Verification token is signed by the trusted external system."
      : "Verification token does not match.",
    ...(outcome.valid ? {} : { reason: outcome.reason }),
    quota: {
      used: quotaResult.quota.verifications_today,
      limit: quotaResult.quota.daily_limit,
      remaining: quotaResult.quota.remaining,
    },
  })
}
