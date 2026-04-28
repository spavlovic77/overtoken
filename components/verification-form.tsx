"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck } from "lucide-react"

export interface VerificationFormValues {
  dic1: string
  dic2: string
  verificationToken: string
}

interface VerificationFormProps {
  values: VerificationFormValues
  onChange: (values: VerificationFormValues) => void
  onSubmit: () => void
  isVerifying: boolean
  disabled?: boolean
  submitLabel?: string
}

export function VerificationForm({
  values,
  onChange,
  onSubmit,
  isVerifying,
  disabled,
  submitLabel = "Verify token",
}: VerificationFormProps) {
  const canSubmit =
    !disabled &&
    !isVerifying &&
    values.dic1.trim().length > 0 &&
    values.dic2.trim().length > 0 &&
    /^[0-9a-fA-F]{512}$/.test(values.verificationToken.trim())

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit()
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dic1">DIC of service provider</Label>
          <Input
            id="dic1"
            value={values.dic1}
            onChange={(e) => onChange({ ...values, dic1: e.target.value })}
            placeholder="e.g. 9876543210"
            autoComplete="off"
            spellCheck={false}
            disabled={isVerifying}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dic2">DIC of participant</Label>
          <Input
            id="dic2"
            value={values.dic2}
            onChange={(e) => onChange({ ...values, dic2: e.target.value })}
            placeholder="e.g. 1234567890"
            autoComplete="off"
            spellCheck={false}
            disabled={isVerifying}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="verificationToken">Verification token</Label>
        <textarea
          id="verificationToken"
          value={values.verificationToken}
          onChange={(e) =>
            onChange({ ...values, verificationToken: e.target.value })
          }
          placeholder="512 hexadecimal characters (256-byte RSA-PSS signature)"
          rows={5}
          spellCheck={false}
          disabled={isVerifying}
          className="font-mono text-xs flex w-full rounded-md border border-input bg-background px-3 py-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          {values.verificationToken.trim().length} / 512 hex characters
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={!canSubmit}
        className="w-full gap-2 text-base font-medium"
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5" />
            {submitLabel}
          </>
        )}
      </Button>
    </form>
  )
}
