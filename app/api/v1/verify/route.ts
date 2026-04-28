import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hashSecret } from "@/lib/crypto"
import { isRateLimited } from "@/lib/rate-limit"
import { verifySchema } from "@/lib/schemas"
import { verifyToken } from "@/lib/verify"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key")
  const apiSecret = request.headers.get("x-api-secret")

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Missing X-API-Key or X-API-Secret header" },
      { status: 401 }
    )
  }

  if (isRateLimited(apiKey)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 requests per minute." },
      { status: 429 }
    )
  }

  const admin = createAdminClient()
  const { data: keyRecord, error: lookupError } = await admin
    .from("api_keys")
    .select("*")
    .eq("key", apiKey)
    .eq("is_active", true)
    .single()

  if (lookupError || !keyRecord) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  if (hashSecret(apiSecret) !== keyRecord.secret_hash) {
    return NextResponse.json({ error: "Invalid API secret" }, { status: 401 })
  }

  if (keyRecord.usage_count >= keyRecord.max_usage) {
    return NextResponse.json(
      {
        error: "Quota exceeded. Upgrade to continue.",
        usage: keyRecord.usage_count,
        limit: keyRecord.max_usage,
      },
      { status: 403 }
    )
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

  const startTime = Date.now()
  const outcome = verifyToken(parsed.data)
  const responseTimeMs = Date.now() - startTime

  await Promise.all([
    admin.rpc("increment_usage", { key_id: keyRecord.id }),
    admin.from("verification_logs").insert({
      api_key_id: keyRecord.id,
      status: outcome.valid ? "valid" : "invalid",
      response_time_ms: responseTimeMs,
    }),
  ])

  return NextResponse.json({
    valid: outcome.valid,
    dic1: parsed.data.dic1,
    dic2: parsed.data.dic2,
    message: outcome.valid
      ? "Verification token is signed by the trusted external system."
      : "Verification token does not match.",
    ...(outcome.valid ? {} : { reason: outcome.reason }),
  })
}
