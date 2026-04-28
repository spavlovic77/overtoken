"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import type { VerificationResult } from "@/types/database"

interface VerificationResultProps {
  result: VerificationResult
  onVerifyAnother: () => void
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
        <div className="rounded-lg bg-muted/30 p-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            DIC of service provider
          </dt>
          <dd className="font-mono text-foreground">{result.dic1}</dd>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            DIC of participant
          </dt>
          <dd className="font-mono text-foreground">{result.dic2}</dd>
        </div>
      </dl>

      <Button variant="outline" onClick={onVerifyAnother} className="w-full">
        Verify another token
      </Button>
    </div>
  )
}
