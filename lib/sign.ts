import "server-only"
import { createPrivateKey, sign, constants, type KeyObject } from "node:crypto"

let cachedKey: KeyObject | null = null

function getPrivateKey(): KeyObject {
  if (cachedKey) return cachedKey
  const pem = process.env.DITEC_PRIVATE_KEY_PEM
  if (!pem) {
    throw new Error(
      "DITEC_PRIVATE_KEY_PEM is not set. Token generation requires the private key."
    )
  }
  cachedKey = createPrivateKey(pem)
  return cachedKey
}

export function signToken(input: { dic1: string; dic2: string }): {
  verificationToken: string
} {
  // Mirrors lib/verify.ts: Ditec signs the uppercase-hex of the ASCII bytes
  // of `${dic1}:${dic2}`, not the raw bytes.
  const messageHex = Buffer.from(`${input.dic1}:${input.dic2}`, "utf8")
    .toString("hex")
    .toUpperCase()
  const message = Buffer.from(messageHex, "utf8")

  const signature = sign("sha256", message, {
    key: getPrivateKey(),
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  })

  return { verificationToken: signature.toString("hex").toUpperCase() }
}
