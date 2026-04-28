"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { LogOut, Github, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  VerificationForm,
  type VerificationFormValues,
} from "@/components/verification-form"
import { VerificationResultCard } from "@/components/verification-result"
import { QuotaDisplay } from "@/components/quota-display"
import { AuthModal } from "@/components/auth-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { DeveloperSection } from "@/components/developer-section"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile, QuotaInfo, VerificationResult } from "@/types/database"

const PENDING_INPUT_KEY = "pendingVerificationInput"

interface LandingContentProps {
  user: User | null
  profile: Profile | null
  initialQuota: QuotaInfo | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const EMPTY_VALUES: VerificationFormValues = {
  dic1: "",
  dic2: "",
  verificationToken: "",
}

export function LandingContent({
  user,
  profile,
  initialQuota,
}: LandingContentProps) {
  const [values, setValues] = useState<VerificationFormValues>(EMPTY_VALUES)
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [quota, setQuota] = useState<QuotaInfo | null>(initialQuota)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const runVerification = useCallback(
    async (input: VerificationFormValues) => {
      setIsVerifying(true)
      setError(null)
      setResult(null)
      try {
        const response = await fetch("/api/v1/verify-ui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 403 && data.quota) {
            setQuota({
              verifications_today: data.quota.used,
              daily_limit: data.quota.limit,
              remaining: data.quota.remaining,
            })
          }
          throw new Error(data.error || "Verification failed")
        }

        if (data.quota) {
          setQuota({
            verifications_today: data.quota.used,
            daily_limit: data.quota.limit,
            remaining: data.quota.remaining,
          })
        }

        setResult(data as VerificationResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsVerifying(false)
      }
    },
    []
  )

  // After OAuth round-trip: restore pending input and auto-verify
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("pendingVerification") !== "true" || !user) return

    window.history.replaceState({}, "", window.location.pathname)

    const stored = localStorage.getItem(PENDING_INPUT_KEY)
    if (!stored) return
    try {
      const restored = JSON.parse(stored) as VerificationFormValues
      localStorage.removeItem(PENDING_INPUT_KEY)
      setValues(restored)
      void runVerification(restored)
    } catch {
      localStorage.removeItem(PENDING_INPUT_KEY)
    }
  }, [user, runVerification])

  const handleSubmit = async () => {
    if (!user) {
      localStorage.setItem(PENDING_INPUT_KEY, JSON.stringify(values))
      setShowAuthModal(true)
      return
    }
    await runVerification(values)
  }

  const handleVerifyAnother = () => {
    setValues(EMPTY_VALUES)
    setResult(null)
    setError(null)
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
        <div className="absolute -bottom-40 left-1/3 h-[450px] w-[450px] rounded-full bg-cyan-400/15 blur-[110px] dark:bg-cyan-500/8" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-glass-border">
        <div className="glass-subtle">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              overtoken
            </span>
            <div className="flex items-center gap-3">
              {user && quota && (
                <QuotaDisplay
                  used={quota.verifications_today}
                  limit={quota.daily_limit}
                  variant="compact"
                />
              )}
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

      <main className="relative mx-auto max-w-5xl px-6 py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-10"
        >
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance"
            >
              Verify a token
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                instantly
              </span>
            </motion.h1>
            <p className="mt-4 mx-auto max-w-2xl text-muted-foreground">
              Confirm that a verification token was signed by the trusted
              external system using its public key.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto w-full max-w-2xl"
          >
            <div className="glass rounded-2xl p-6 md:p-8">
              {result ? (
                <VerificationResultCard
                  result={result}
                  onVerifyAnother={handleVerifyAnother}
                />
              ) : (
                <div className="flex flex-col gap-6">
                  <VerificationForm
                    values={values}
                    onChange={setValues}
                    onSubmit={handleSubmit}
                    isVerifying={isVerifying}
                  />
                  {user && quota && (
                    <QuotaDisplay
                      used={quota.verifications_today}
                      limit={quota.daily_limit}
                    />
                  )}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-destructive/10 backdrop-blur-sm p-4 text-center text-sm text-destructive border border-destructive/20"
                    >
                      {error}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 mx-auto max-w-2xl"
          >
            <div className="glass-subtle rounded-2xl p-6 border border-primary/20 bg-primary/5">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    How verification works
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The external signer takes{" "}
                    <code className="font-mono text-foreground">DIC1:DIC2</code>
                    , hex-encodes it, and signs the result with their private
                    key using <span className="font-medium">RSA-PSS</span> /
                    SHA-256 / 32-byte salt. We hold their public key and run
                    the verification on the server.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <DeveloperSection
            user={user}
            onAuthRequired={() => setShowAuthModal(true)}
          />
        </motion.div>
      </main>

      <footer className="relative border-t border-glass-border">
        <div className="glass-subtle py-8">
          <div className="mx-auto max-w-5xl px-6 flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground italic">
              overtoken — RSA-PSS signature verification service
            </p>
            <Link
              href="/generate"
              className="text-xs text-muted-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
            >
              Generate a test token
            </Link>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </footer>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        pendingFlag="pendingVerification"
      />
    </div>
  )
}
