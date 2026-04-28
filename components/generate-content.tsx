"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  LogOut,
  ShieldCheck,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthModal } from "@/components/auth-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/database"

interface GenerateContentProps {
  user: User | null
  profile: Profile | null
}

export function GenerateContent({ user, profile }: GenerateContentProps) {
  const [dic1, setDic1] = useState("")
  const [dic2, setDic2] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [verifyResult, setVerifyResult] = useState<
    null | { valid: boolean; message: string }
  >(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const supabase = createClient()

  const onlyDigits = (s: string) => s.replace(/\D/g, "").slice(0, 10)
  const canSubmit =
    !isGenerating && /^\d{10}$/.test(dic1) && /^\d{10}$/.test(dic2)

  const handleGenerate = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    setIsGenerating(true)
    setError(null)
    setToken(null)
    setVerifyResult(null)
    try {
      const res = await fetch("/api/v1/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dic1, dic2 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Token generation failed")
      setToken(data.verificationToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleVerifyNow = async () => {
    if (!token) return
    setIsVerifying(true)
    setVerifyResult(null)
    try {
      const res = await fetch("/api/v1/verify-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dic1, dic2, verificationToken: token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVerifyResult({
          valid: false,
          message: data.error || "Verification failed",
        })
      } else {
        setVerifyResult({
          valid: Boolean(data.valid),
          message: data.message,
        })
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] dark:bg-primary/10" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-500/10" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-glass-border">
        <div className="glass-subtle">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to verify
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  {profile?.avatar_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full ring-2 ring-glass-border"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="gap-1.5 hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="glass-subtle border-glass-border hover:bg-accent"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-3xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-8"
        >
          <header>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              <Wand2 className="h-3.5 w-3.5" />
              Test tool
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Generate a verification token
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign{" "}
              <code className="font-mono text-foreground">DIC1:DIC2</code> with
              the configured private key to produce a token. Use this only to
              test the verification endpoint — production tokens come from the
              external signer.
            </p>
          </header>

          <div className="glass rounded-2xl p-6 md:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (canSubmit) handleGenerate()
              }}
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gen-dic1">DIC of service provider</Label>
                  <Input
                    id="gen-dic1"
                    value={dic1}
                    onChange={(e) => setDic1(onlyDigits(e.target.value))}
                    placeholder="e.g. 9876543210"
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gen-dic2">DIC of participant</Label>
                  <Input
                    id="gen-dic2"
                    value={dic2}
                    onChange={(e) => setDic2(onlyDigits(e.target.value))}
                    placeholder="e.g. 1234567890"
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit}
                className="w-full gap-2 text-base font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    Generate token
                  </>
                )}
              </Button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            {token && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <Label>Verification token</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-muted/40 p-4 font-mono text-xs text-foreground">
                  {token}
                </pre>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {token.length} hex characters · 256-byte RSA-PSS signature
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyNow}
                    disabled={isVerifying}
                    className="gap-1.5"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verify it now
                      </>
                    )}
                  </Button>
                </div>

                {verifyResult && (
                  <div
                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                      verifyResult.valid
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                        : "border-destructive/30 bg-destructive/5 text-destructive"
                    }`}
                  >
                    {verifyResult.valid ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {verifyResult.message}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}
