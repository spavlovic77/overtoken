# Generating a verification token

Reference for projects that need to sign `${DIC1}:${DIC2}` so the resulting
token verifies against [overtoken](../README.md)'s `/api/v1/verify` endpoint.

## At a glance

| | |
|---|---|
| **Algorithm** | RSA-PSS |
| **Hash** | SHA-256 |
| **MGF** | MGF1 with SHA-256 |
| **Salt length** | 32 bytes (= digest length) |
| **Key size** | 2048-bit RSA |
| **Input message** | UPPERCASE hex string of the UTF-8 bytes of `${DIC1}:${DIC2}` *(not the raw bytes)* |
| **Output token** | UPPERCASE hex string, 512 characters (256 bytes) |
| **DIC format** | exactly 10 digits, `0`–`9` |

## ⚠️ The non-obvious quirk

The signer does **not** sign the raw bytes of `9876543210:1234567890`. It first
hex-encodes those bytes (uppercase, no separator) and signs the resulting
ASCII string of hex characters.

Worked example for DIC1=`9876543210`, DIC2=`1234567890`:

```
plaintext       : 9876543210:1234567890           (21 ASCII bytes)
hex(plaintext)  : 393837363534333231303A31323334353637383930   (42 ASCII chars)
message-to-sign : 393837363534333231303A31323334353637383930   (these 42 chars as UTF-8)
```

Get this wrong and signatures won't verify.

## Test private key

> **PUBLIC TEST KEY — non-secret.** Published Ditec test infrastructure.
> Anyone integrating against Ditec test SMP/eDesk has access to it.
> **Never use this key for production tokens.**

```pem
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIX/409TOJ+yIh
fG9So3qr78xMS3f2Mh4G/ow6RJ5ZOnTdmfg797xMQgD006cFxMWXjl0c/u94kdqE
eEtKQzE88pV2Kp2JfTvBOZm9aHUAx2C4a5DpYfrJ0BRijPlLb9inZsa3/qSW/7gA
YsA9nEFtiHz7vj98Xifw/dmX2/b/llA0V+A6vjs4CWPnAa3l6abkZALxZEirNH2R
3lMBTYtmwFuRnH5uCP5Vfy/gfZ0jNHUhdiVKTkNswnotbdBllWZU9psDRVlgH8PJ
qgS7/iPBnIb22fxw1O0p0zumLH63HV/BQUNLA8cKHHShQ29vni1IooRj2mBA4OMV
W7ZsQF7lAgMBAAECggEAZSbwcVOHHRTF+hmTKSiV+M4pWCqQ+Jv8RJOjvpZ9SZYV
APmFMuCxEd4QFYfzPRpElWms38JiqX8XzN/dQjQBWz8q7Gg+9vVdgQHO9qsQxb/g
t7i1gtuPeumsIMQB5W8k8/0SPDg0ZnXZMXioi3GiJeVNEtjLu8DccO/1NJA6dHNM
WmAAE73AcEpNXxXEYn48Y8/0ecJV4MjYpcVJmBiGhD4lLCWQ6saxRdWNK4YbTuTs
7NaLfvduxKvf+5BbILtijI6vmPMMQXr0tG5sOeQsBRLwXwulTbPaon9sIYP+A2sw
cJEsXPTY6rvBU6O7zkbGc+PAIFymCP57cL2+hgeFUQKBgQDZ4hfbNkcGDUe1DUum
UPD8Z5g15Jfa5XB25siihEvwGZ70zh+Ftbux77OrWZ255Y/RjivkULZLSazGKxV1
Y32IckVe/qqIp9ndJAhbxmT8H9feJozH7N9npEGXYtjWGVaXt9eYrONqW90VzVBw
DLHIJdPYtdLaPglBKTcN4LbjFwKBgQDrbctQO0wvBddWEhyDojLFRpD9qVxLVI4R
BE2P0uFdq76AGF3zLU08dBqLa7Ro6aOOm4b6ZNFm4XpiJZC6dEjuMomlcRHArs7Y
MoeQEmk6IZskay7O3DlNgyOG2g9KV7FlHhtaGKdzbupgiPIK2pfMhjzLxpFk2WzY
roJyeXn7YwKBgQCN06J7yyUIR3S54eGwbVewtS5bRmWi018VxrwrLbrQm5zg9ZuH
SfjXppRpoXgOHeQ0IDtp7y/6agbRKBJby1tXiiql31fahIhIbsASHV52z7OQo79Y
FFSH/l/Dz1AebXf0YnMwqrmN7iZHntIRXfILurPfiNurvF4B0HZJzlC+GQKBgAZa
01caEqdeR/65xG1FLoumqPk/3g7mfGM3M4TDU3P808qPXdHXkjMkiybiRF9klxad
WhpeKEzXnz8Q9oQh6WoMkSyXDbyeu1SYoJIh/RclmxNzlTLePOm7tXTJZApErbQm
COT4r2RtRQRQDgB/AAP0R6XUeU44lDiRFVJTtxgzAoGAUrIW0JLrRpcIQcIrbhIv
0gqpOH6fvNOYvQA145aXbj6D5BzR5ixPD0iYH+4IKgXNS26oV24kQI/WyA5TxBfW
2DZwC7z1u8lbZ3jTMpZekPkWIVwITtQWsAxYa5wWA++Pzw5CtsCryl3ImYIgMOxa
leHqHCd+GS66xIGGzX4rQAY=
-----END PRIVATE KEY-----
```

The matching public certificate is at [`rsa/gv01.cer`](../rsa/) and is what
overtoken uses to verify.

## Code samples

### Node.js (built-in `node:crypto`)

```js
import { createPrivateKey, sign, constants } from "node:crypto"

const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
...paste key from above...
-----END PRIVATE KEY-----`

export function generateVerificationToken(dic1, dic2) {
  const messageHex = Buffer.from(`${dic1}:${dic2}`, "utf8")
    .toString("hex")
    .toUpperCase()
  const message = Buffer.from(messageHex, "utf8")

  const signature = sign("sha256", message, {
    key: createPrivateKey(PRIVATE_KEY_PEM),
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  })

  return signature.toString("hex").toUpperCase()
}

const token = generateVerificationToken("9876543210", "1234567890")
console.log(token) // 512 uppercase hex chars
```

### Python (`cryptography`)

```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

PRIVATE_KEY_PEM = b"""-----BEGIN PRIVATE KEY-----
...paste key from above...
-----END PRIVATE KEY-----"""

_key = serialization.load_pem_private_key(PRIVATE_KEY_PEM, password=None)

def generate_verification_token(dic1: str, dic2: str) -> str:
    message_hex = f"{dic1}:{dic2}".encode("utf-8").hex().upper()
    message = message_hex.encode("utf-8")

    signature = _key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=32,  # = digest length
        ),
        hashes.SHA256(),
    )
    return signature.hex().upper()

token = generate_verification_token("9876543210", "1234567890")
print(len(token), token[:32], "...")
```

Install: `pip install cryptography`.

### C# / .NET (`RSA` from `System.Security.Cryptography`)

```csharp
using System;
using System.Security.Cryptography;
using System.Text;

public static class VerificationToken
{
    private const string PrivateKeyPem = @"-----BEGIN PRIVATE KEY-----
...paste key from above...
-----END PRIVATE KEY-----";

    public static string Generate(string dic1, string dic2)
    {
        // 1. UTF-8 bytes of "DIC1:DIC2"
        var plain = Encoding.UTF8.GetBytes($"{dic1}:{dic2}");

        // 2. Uppercase-hex string of those bytes, then UTF-8 bytes of THAT
        var messageHex = Convert.ToHexString(plain); // already uppercase
        var message = Encoding.UTF8.GetBytes(messageHex);

        // 3. Sign with RSA-PSS / SHA-256 / salt = 32
        using var rsa = RSA.Create();
        rsa.ImportFromPem(PrivateKeyPem);

        var signature = rsa.SignData(
            message,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pss);

        return Convert.ToHexString(signature); // already uppercase
    }
}

// usage
var token = VerificationToken.Generate("9876543210", "1234567890");
Console.WriteLine(token);
```

`RSASignaturePadding.Pss` defaults to salt length = digest length (32 for SHA-256), which is exactly what we want.

### PHP (`openssl_sign` with PSS via `phpseclib`)

PHP's built-in `openssl_sign` does **not** support PSS padding directly,
so use [phpseclib](https://phpseclib.com/):

```php
use phpseclib3\Crypt\RSA;

$pem = <<<PEM
-----BEGIN PRIVATE KEY-----
...paste key from above...
-----END PRIVATE KEY-----
PEM;

function generateVerificationToken(string $dic1, string $dic2, string $pem): string
{
    $messageHex = strtoupper(bin2hex($dic1 . ':' . $dic2));
    $key = RSA::loadPrivateKey($pem)
        ->withHash('sha256')
        ->withMGFHash('sha256')
        ->withSaltLength(32);
    $signature = $key->sign($messageHex);
    return strtoupper(bin2hex($signature));
}
```

Install: `composer require phpseclib/phpseclib:~3.0`.

### openssl CLI (quick ad-hoc test)

```bash
DIC1=9876543210
DIC2=1234567890

# 1. Build the message: hex of UTF-8 bytes of DIC1:DIC2, uppercased
echo -n "${DIC1}:${DIC2}" | xxd -p -u | tr -d '\n' > message.txt

# 2. Sign with RSA-PSS / SHA-256 / salt 32
openssl dgst -sha256 \
  -sign rsa/gv01-private.pem \
  -sigopt rsa_padding_mode:pss \
  -sigopt rsa_pss_saltlen:32 \
  -out signature.bin \
  message.txt

# 3. Hex-encode the signature, uppercase
xxd -p -u signature.bin | tr -d '\n'; echo
```

Output: 512 hex characters.

## Verifying your implementation

Before integrating, sanity-check by sending your generated token to the
overtoken endpoint:

```bash
TOKEN=$(your-generator 9876543210 1234567890)

curl -X POST https://your-overtoken-domain/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ot_..." \
  -H "X-API-Secret: ots_..." \
  -d "{\"dic1\":\"9876543210\",\"dic2\":\"1234567890\",\"verificationToken\":\"$TOKEN\"}"
```

Expected response:

```json
{ "valid": true, "dic1": "9876543210", "dic2": "1234567890", "message": "..." }
```

If `valid` is `false`, check in this order:

1. **Message format.** Are you signing the **uppercase hex string** of `DIC1:DIC2`, or the raw bytes? (Common mistake.)
2. **Padding mode.** RSA-PSS, not PKCS#1 v1.5. PSS produces a different signature every run; PKCS#1 v1.5 is deterministic.
3. **Salt length.** 32 bytes. Some libraries default to 0 or to the maximum.
4. **Hash.** SHA-256 for both the digest and MGF1.
5. **Token encoding.** Hex (case-insensitive on the wire — the verifier accepts either, but uppercase matches the convention).
6. **Key.** This document's PEM is the test key; production deployments use a different keypair.

## Going to production

When ditec issues a non-test signing key:

- The private key must stay with ditec (or whoever runs the signer). **Don't put it in your application's env vars** unless your application is the signer itself.
- The public certificate replaces overtoken's bundled `gv01.cer` via the `DITEC_PUBLIC_KEY_PEM` env var on Vercel.
- Tokens generated with the production private key verify against the production public certificate. The test PEM here only round-trips against the test certificate.
