import "server-only"
import { createPublicKey, verify, constants, type KeyObject } from "node:crypto"
import { BUNDLED_PUBLIC_KEY_PEM } from "@/lib/public-key-pem"

let cachedKey: KeyObject | null = null

function getPublicKey(): KeyObject {
  if (cachedKey) return cachedKey
  const pem = process.env.DITEC_PUBLIC_KEY_PEM ?? BUNDLED_PUBLIC_KEY_PEM
  cachedKey = createPublicKey(pem)
  return cachedKey
}

export type VerifyOutcome =
  | { valid: true }
  | { valid: false; reason: string }

export function verifyToken(input: {
  dic1: string
  dic2: string
  verificationToken: string
}): VerifyOutcome {
  // Ditec signs the uppercase-hex representation of the ASCII bytes of
  // `${dic1}:${dic2}` — i.e. the hex string is itself the message, not the
  // raw bytes it encodes. Verified empirically against rsa/vystup*.txt.
  const messageHex = Buffer.from(`${input.dic1}:${input.dic2}`, "utf8")
    .toString("hex")
    .toUpperCase()
  const message = Buffer.from(messageHex, "utf8")

  let signature: Buffer
  try {
    signature = Buffer.from(input.verificationToken, "hex")
  } catch {
    return { valid: false, reason: "Token is not valid hex" }
  }

  if (signature.length !== 256) {
    return {
      valid: false,
      reason: `Token has wrong byte length (${signature.length}, expected 256)`,
    }
  }

  const ok = verify(
    "sha256",
    message,
    {
      key: getPublicKey(),
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    },
    signature
  )

  return ok ? { valid: true } : { valid: false, reason: "Signature does not match" }
}
