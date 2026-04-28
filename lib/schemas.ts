import { z } from 'zod'

export const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export type CreateKeyInput = z.infer<typeof createKeySchema>

const HEX_512 = /^[0-9a-fA-F]{512}$/

export const verifySchema = z.object({
  dic1: z.string().min(1, 'dic1 is required').max(64),
  dic2: z.string().min(1, 'dic2 is required').max(64),
  verificationToken: z
    .string()
    .regex(HEX_512, 'verificationToken must be 512 hex characters (256 bytes)'),
})

export type VerifyInput = z.infer<typeof verifySchema>
