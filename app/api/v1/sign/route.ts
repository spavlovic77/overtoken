import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { signSchema } from "@/lib/schemas"
import { signToken } from "@/lib/sign"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (process.env.ENABLE_TOKEN_GENERATION !== "true") {
    return NextResponse.json(
      { error: "Token generation is disabled on this deployment." },
      { status: 403 }
    )
  }

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

  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const { verificationToken } = signToken(parsed.data)
    return NextResponse.json({
      dic1: parsed.data.dic1,
      dic2: parsed.data.dic2,
      verificationToken,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Signing failed",
      },
      { status: 500 }
    )
  }
}
