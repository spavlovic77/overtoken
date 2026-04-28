# overtoken

Verification token service. Verifies that a token was signed by an authorized
external system using public-key signature verification.

## How it works

A user (or external system) submits three fields to `POST /api/v1/verify`:

- `dic1` — DIC of the service provider
- `dic2` — DIC of the participant
- `verificationToken` — hex-encoded RSA-PSS signature

The backend rebuilds the message `${dic1}:${dic2}` (UTF-8) and verifies the
signature against the bundled public key (`lib/gv01-public.cer`) using
**RSA-PSS / SHA-256 / 32-byte salt**. If the signature verifies, the token is
proven to have been signed by the holder of the matching private key.

## Auth model

Mirrors `peppol-validator-api`:

- Browser users: Supabase OAuth (Google) → `/dashboard` for managing keys.
- API consumers: `X-API-Key` + `X-API-Secret` headers.
  Keys: `ot_<hex>`. Secrets: `ots_<base64url>` (only the SHA-256 hash is stored).

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Database

Run `scripts/schema.sql` in Supabase SQL editor, then the migrations
`002-*.sql`, `003-*.sql`, `004-*.sql` in order.
