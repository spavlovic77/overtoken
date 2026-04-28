import { z } from 'zod'

export const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export type CreateKeyInput = z.infer<typeof createKeySchema>

const DIC = /^\d{10}$/
const DIC_MESSAGE = 'must be exactly 10 digits (0-9)'
const HEX_512 = /^[0-9a-fA-F]{512}$/

export const verifySchema = z.object({
  dic1: z.string().regex(DIC, `dic1 ${DIC_MESSAGE}`),
  dic2: z.string().regex(DIC, `dic2 ${DIC_MESSAGE}`),
  verificationToken: z
    .string()
    .regex(HEX_512, 'verificationToken must be 512 hex characters (256 bytes)'),
})

export type VerifyInput = z.infer<typeof verifySchema>

export const signSchema = z.object({
  dic1: z.string().regex(DIC, `dic1 ${DIC_MESSAGE}`),
  dic2: z.string().regex(DIC, `dic2 ${DIC_MESSAGE}`),
})

export type SignInput = z.infer<typeof signSchema>
