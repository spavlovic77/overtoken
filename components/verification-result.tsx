"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, CheckCircle2, Copy, XCircle } from "lucide-react"
import type { VerificationResult } from "@/types/database"

interface VerificationResultProps {
  result: VerificationResult
  onVerifyAnother: () => void
}

function DicCard({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-muted/30 p-3">
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="font-mono text-foreground">{value}</dd>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="-mr-1 -mt-1 h-7 w-7 text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}

export function VerificationResultCard({
  result,
  onVerifyAnother,
}: VerificationResultProps) {
  const isValid = result.valid

  return (
    <div className="flex flex-col gap-5">
      <div
        className={`flex items-start gap-3 rounded-xl p-4 border ${
          isValid
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-destructive/30 bg-destructive/5"
        }`}
      >
        {isValid ? (
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-500" />
        ) : (
          <XCircle className="h-6 w-6 flex-shrink-0 text-destructive" />
        )}
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-foreground">
            {isValid ? "Token is authentic" : "Token rejected"}
          </h3>
          <p className="text-sm text-muted-foreground">{result.message}</p>
          {result.reason && (
            <p className="text-xs text-destructive/80">{result.reason}</p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
        <DicCard label="DIC of service provider" value={result.dic1} />
        <DicCard label="DIC of participant" value={result.dic2} />
      </dl>

      <Button variant="outline" onClick={onVerifyAnother} className="w-full">
        Verify another token
      </Button>
    </div>
  )
}
