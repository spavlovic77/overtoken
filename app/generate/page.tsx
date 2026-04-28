import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GenerateContent } from "@/components/generate-content"
import type { Profile } from "@/types/database"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Generate test token",
  description:
    "Sign DIC1:DIC2 with the configured private key to produce a verification token for testing.",
  robots: { index: false, follow: false },
}

export default async function GeneratePage() {
  if (process.env.ENABLE_TOKEN_GENERATION !== "true") {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
  }

  return <GenerateContent user={user} profile={profile} />
}
