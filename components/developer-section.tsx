"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Code2, Copy, Check, Key, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User } from "@supabase/supabase-js"

interface DeveloperSectionProps {
  user: User | null
  onAuthRequired: () => void
}

type CodeLanguage = "curl" | "nodejs" | "python"

const ENDPOINT = "/api/v1/verify"

const SAMPLE_BODY = {
  dic1: "9876543210",
  dic2: "1234567890",
  verificationToken: "1B305BBDF079...A1B8F87B111C443AFD8A6F573DFE7279852D23",
}

const SNIPPETS: Record<CodeLanguage, (origin: string) => string> = {
  curl: (origin) => `curl -X POST ${origin}${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ot_..." \\
  -H "X-API-Secret: ots_..." \\
  -d '${JSON.stringify(SAMPLE_BODY)}'`,
  nodejs: (origin) => `const res = await fetch("${origin}${ENDPOINT}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.OVERTOKEN_KEY,
    "X-API-Secret": process.env.OVERTOKEN_SECRET,
  },
  body: JSON.stringify({
    dic1: "9876543210",
    dic2: "1234567890",
    verificationToken: "1B305BBDF079...",
  }),
})
const data = await res.json()
console.log(data.valid)`,
  python: (origin) => `import os, requests

res = requests.post(
    "${origin}${ENDPOINT}",
    headers={
        "X-API-Key": os.environ["OVERTOKEN_KEY"],
        "X-API-Secret": os.environ["OVERTOKEN_SECRET"],
    },
    json={
        "dic1": "9876543210",
        "dic2": "1234567890",
        "verificationToken": "1B305BBDF079...",
    },
)
print(res.json()["valid"])`,
}

export function DeveloperSection({ user, onAuthRequired }: DeveloperSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [language, setLanguage] = useState<CodeLanguage>("curl")
  const [copied, setCopied] = useState(false)

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://overtoken.app"
  const snippet = SNIPPETS[language](origin)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl glass-subtle border border-glass-border px-6 py-4 transition hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">For developers</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-5 rounded-2xl glass-subtle border border-glass-border p-6">
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Terminal className="h-4 w-4" />
                  Endpoint
                </div>
                <code className="block rounded-lg bg-muted/40 px-3 py-2 font-mono text-sm">
                  POST {ENDPOINT}
                </code>
                <p className="text-sm text-muted-foreground">
                  Send a JSON body with <code className="font-mono">dic1</code>,{" "}
                  <code className="font-mono">dic2</code>, and{" "}
                  <code className="font-mono">verificationToken</code> (512 hex
                  chars). Authenticate with{" "}
                  <code className="font-mono">X-API-Key</code> and{" "}
                  <code className="font-mono">X-API-Secret</code> headers.
                </p>
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {(["curl", "nodejs", "python"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                          language === lang
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                        }`}
                      >
                        {lang === "nodejs" ? "Node.js" : lang}
                      </button>
                    ))}
                  </div>
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
                <pre className="overflow-x-auto rounded-lg bg-muted/40 p-4 font-mono text-xs text-foreground">
                  {snippet}
                </pre>
              </section>

              <section className="flex items-center justify-between gap-3 rounded-xl border border-glass-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">
                    {user
                      ? "Manage your API keys to call this endpoint."
                      : "Sign in to create an API key."}
                  </span>
                </div>
                {user ? (
                  <Link href="/dashboard">
                    <Button size="sm" variant="default">
                      Open dashboard
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" onClick={onAuthRequired}>
                    Sign in
                  </Button>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
