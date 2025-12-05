# Extract Messages

Grab every inbox and sent message using the Mailchain SDK so you can inspect the decrypted payloads locally.

## Requirements
- Node.js 18+
- A Mailchain account with a `SECRET_RECOVERY_PHRASE`

## Setup
```bash
cd extract-messages
npm install
```

## Usage
```bash
SECRET_RECOVERY_PHRASE="word ..." npm run get-messages
```
- The script fetches every page of inbox and sent messages, respecting `MAILCHAIN_PAGE_SIZE` (default `25`).
- Message data is written into `output/<category>/<owner>/` where each `.json` contains headers plus decoded text; any HTML part is saved alongside as `.html`.

## Notes
- Set `MAILCHAIN_OUTPUT_DIR` to redirect the export folder.
- Failures to parse MIME bodies fall back to the raw UTF-8 payload and log a warning so you know which message needs manual review.
