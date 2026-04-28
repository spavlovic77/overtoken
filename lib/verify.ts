import "server-only"
import { createPublicKey, verify, constants, type KeyObject } from "node:crypto"

const BUNDLED_PUBLIC_KEY_PEM = `-----BEGIN CERTIFICATE-----
MIIDJDCCAgygAwIBAgIQHSSx7pWnf55G9Cq52YU95TANBgkqhkiG9w0BAQsFADAY
MRYwFAYDVQQDDA1sb2NhbGhvc3RcZ3YxMB4XDTI2MDMxMjEwMjQ0MFoXDTI3MDMx
MjEwNDQ0MFowGDEWMBQGA1UEAwwNbG9jYWxob3N0XGd2MTCCASIwDQYJKoZIhvcN
AQEBBQADggEPADCCAQoCggEBAMhf/jT1M4n7IiF8b1KjeqvvzExLd/YyHgb+jDpE
nlk6dN2Z+Dv3vExCAPTTpwXExZeOXRz+73iR2oR4S0pDMTzylXYqnYl9O8E5mb1o
dQDHYLhrkOlh+snQFGKM+Utv2Kdmxrf+pJb/uABiwD2cQW2IfPu+P3xeJ/D92Zfb
9v+WUDRX4Dq+OzgJY+cBreXppuRkAvFkSKs0fZHeUwFNi2bAW5Gcfm4I/lV/L+B9
nSM0dSF2JUpOQ2zCei1t0GWVZlT2mwNFWWAfw8mqBLv+I8GchvbZ/HDU7SnTO6Ys
frcdX8FBQ0sDxwocdKFDb2+eLUiihGPaYEDg4xVbtmxAXuUCAwEAAaNqMGgwDgYD
VR0PAQH/BAQDAgQQMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAYBgNV
HREEETAPgg1sb2NhbGhvc3RcZ3YxMB0GA1UdDgQWBBSrS8KvoTDjhzcrLTTtXeaW
4y9fEjANBgkqhkiG9w0BAQsFAAOCAQEAhJ5IksBwiNXz3zLzSIeSuCrE3LafAyKK
IfnO6GBNgkfuBLOk6sTGJkskeyF/ZCJPVAqHR1hI4nKjBAKzXR7gsPywMUbSmhTE
fPglTTx0aoOom/OtXEZzlf/+bb9MGNojKDQN6IdcNZOfiuoOH0cgOeX5sNqcM9Xn
tPLpyFGRnZbrGRwR9Lrd048k3JNCHNe1Rdr3noAtLyHjnnmjxZCXywLc9e7T1vgd
Ah/x/rY2fYgeQ0gzOgBazVg220EK//iRxGnFiQP0U/SuLhKXaPPDW/lwG4n2HbV9
AfDeCmqM+JzkAOwVVOsVWUoeot8VS1gWbU9q9xzlHdVh5ILQ2pWYfA==
-----END CERTIFICATE-----
`

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
