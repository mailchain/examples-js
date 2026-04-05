# Extract Messages

Grab every inbox and sent message using the Mailchain SDK so you can inspect the decrypted payloads locally.

> **New to this?** Read the full [step-by-step tutorial](TUTORIAL.md).

## Requirements
- Node.js 18+
- A Mailchain account with a `SECRET_RECOVERY_PHRASE`

## Setup
```bash
cd extract-messages
npm install
```

## Usage
Set the phrase in the **same command** as `npm run get-messages`, or **`export`** it first. A plain assignment on its own line does not pass the variable to Node.

```bash
SECRET_RECOVERY_PHRASE="word ..." npm run get-messages
```

Alternatively:

```bash
export SECRET_RECOVERY_PHRASE="word ..."
npm run get-messages
```
- The script fetches every page of inbox and sent messages, respecting `MAILCHAIN_PAGE_SIZE` (default `25`).
- Message data is written into `output/<category>/<owner>/` where each `.json` contains headers plus decoded text; any HTML part is saved alongside as `.html`.

## Advanced: authenticating with an Ed25519 key

If you have raw Ed25519 key material instead of a mnemonic phrase, set **one** of the following environment variables instead of `SECRET_RECOVERY_PHRASE`:

| Variable | Expected value |
|----------|---------------|
| `MAILCHAIN_ED25519_SEED_HEX` | 32-byte Ed25519 seed as hex (64 hex characters) |
| `MAILCHAIN_ED25519_SECRET_KEY_HEX` | 64-byte Ed25519 secret key as hex (128 hex characters) |

A leading `0x` prefix is accepted but not required. Only **one** credential source may be set at a time; the script will error if you combine them.

```bash
MAILCHAIN_ED25519_SEED_HEX="aabbcc..." npm run get-messages
```

These variables carry the same sensitivity as your Secret Recovery Phrase. Keep them out of version control and shared logs.

## Notes
- Set `MAILCHAIN_OUTPUT_DIR` to redirect the export folder.
- Failures to parse MIME bodies fall back to the raw UTF-8 payload and log a warning so you know which message needs manual review.

## How to find your Secret Recovery Phrase

To export your Secret Recovery Phrase, please see this article: https://docs.mailchain.com/user/guides/settings/secret-recovery-phrase/
