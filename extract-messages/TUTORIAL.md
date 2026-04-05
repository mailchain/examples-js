# How to Extract Your Mailchain Messages

Mailchain stores your mail in an encrypted inbox. Sometimes you want a local copy for backups, audits, or building your own tools. This guide walks you through exporting all inbox and sent messages to files on your computer using the Mailchain SDK.

You do not need to be a blockchain expert. You need a Mailchain account and basic comfort with a terminal.

## What you will have at the end

After you finish, you will have:

- One JSON file per message containing headers and decrypted body text
- Optional `.html` files when a message includes an HTML part
- Console output listing each message's subject, sender, snippet, and file path

The example script lives in the [Mailchain JavaScript examples](https://github.com/mailchain/examples-js) repository under `extract-messages/`.

## Before you start

**Requirements**

- **Node.js 18 or newer** ([nodejs.org](https://nodejs.org))
- A **Mailchain account** and your **Secret Recovery Phrase** (the same secret you use to access your wallet-backed identity in Mailchain)

**Security note**

Your Secret Recovery Phrase controls access to your Mailchain identity. Treat it like a password:

- Do not paste it into chat, tickets, or public code.
- Prefer a one-line terminal command with an environment variable (shown below) over a value committed to git.
- If you suspect it leaked, rotate or recover access per [Mailchain's documentation](https://docs.mailchain.com/).

To view or export your phrase, see: [Secret Recovery Phrase guide](https://docs.mailchain.com/user/guides/settings/secret-recovery-phrase/).

## Step 1: Get the example code

Clone the examples repository and open the extract folder:

```bash
git clone https://github.com/mailchain/examples-js.git
cd examples-js/extract-messages
```

## Step 2: Install dependencies

```bash
npm install
```

This pulls in the Mailchain SDK packages and [mailparser](https://www.npmjs.com/package/mailparser), which converts standard MIME email bodies into plain text and HTML.

## Step 3: Run the export

Set your phrase in the **same command** as `npm run get-messages`, or **`export`** it first. A plain assignment on its own line creates a shell variable that is not passed to Node.

**One line (recommended):**

```bash
SECRET_RECOVERY_PHRASE="your twelve or twenty four words here" npm run get-messages
```

**Or export, then run:**

```bash
export SECRET_RECOVERY_PHRASE="your twelve or twenty four words here"
npm run get-messages
```

The script will:

1. Page through every inbox message and every sent message (default page size: 25).
2. Download each encrypted body and decrypt it with your keys.
3. Write results under `output/` and print a short log for each message.

## Step 4: Understand the output

### File layout

```
output/
  inbox/
    <owner>/
      <message-id>.json
      <message-id>.html   (only when the message has an HTML part)
  sent/
    <owner>/
      ...
```

### What each JSON file contains

- **preview**: metadata from Mailchain (identifiers, mailbox info in serialized form)
- **fullMessage**: content type, headers (dates and signatures normalized for JSON), decoded text body, and raw body

If you see a warning in the terminal like "Failed to parse message body," the script still saves the message. It falls back to the raw UTF-8 payload so nothing is silently dropped. You can inspect that file manually.

## Configuration

| Variable | What it does | Default |
|----------|-------------|---------|
| `SECRET_RECOVERY_PHRASE` | 24-word BIP-39 mnemonic (recommended) | *none* |
| `MAILCHAIN_PAGE_SIZE` | Messages per API page | `25` |
| `MAILCHAIN_OUTPUT_DIR` | Folder for exports (relative to project root) | `output` |

Example with all three:

```bash
MAILCHAIN_OUTPUT_DIR=./my-backup MAILCHAIN_PAGE_SIZE=50 SECRET_RECOVERY_PHRASE="…" npm run get-messages
```

## Advanced: authenticating with an Ed25519 key

If you have raw Ed25519 key material instead of a mnemonic phrase, set **one** of these environment variables instead of `SECRET_RECOVERY_PHRASE`:

| Variable | Expected value |
|----------|---------------|
| `MAILCHAIN_ED25519_SEED_HEX` | 32-byte Ed25519 seed as hex (64 hex characters) |
| `MAILCHAIN_ED25519_SECRET_KEY_HEX` | 64-byte Ed25519 secret key as hex (128 hex characters) |

A leading `0x` prefix is accepted but not required. Only **one** credential source may be set at a time; the script will error if you combine them.

```bash
MAILCHAIN_ED25519_SEED_HEX="aabbcc..." npm run get-messages
```

These variables carry the same sensitivity as your Secret Recovery Phrase. Keep them out of version control and shared logs.

## How the script works

A brief walk through the key parts of `src/get-messages.mjs`:

### Authentication

The `createKeyRing()` function reads one of three environment variables and builds a `KeyRing`:

```javascript
const { KeyRing } = require('@mailchain/keyring');
const { ED25519PrivateKey } = require('@mailchain/crypto');
const { decodeHexAny } = require('@mailchain/encoding');

// Mnemonic (default)
KeyRing.fromSecretRecoveryPhrase(phrase);

// Ed25519 seed (advanced)
KeyRing.fromPrivateKey(ED25519PrivateKey.fromSeed(decodeHexAny(seedHex)));

// Ed25519 secret key (advanced)
KeyRing.fromPrivateKey(ED25519PrivateKey.fromSecretKey(decodeHexAny(secretKeyHex)));
```

### Fetching messages

`fetchAllMessagePreviews` pages through the API until there are no more results. Inbox and sent messages are fetched in parallel:

```javascript
const [inboxPreviews, sentPreviews] = await Promise.all([
  fetchAllMessagePreviews((params) => mailboxOperations.getInboxMessages(params)),
  fetchAllMessagePreviews((params) => mailboxOperations.getSentMessages(params)),
]);
```

### Decryption and parsing

Each message body is downloaded as an encrypted `ArrayBuffer`, decrypted client-side, then run through `mailparser` to separate plain text from HTML:

```javascript
const payload = await fetchMessagePayload(preview.messageId);
const fullBody = Buffer.from(payload.Content).toString('utf8');
const parsedBody = await simpleParser(fullBody);
```

If `simpleParser` fails on a particular message, the raw UTF-8 text is kept and a warning is logged.

## Troubleshooting

**`No credentials provided`**
You ran `npm run get-messages` without setting an environment variable. Set it on the same line or `export` it first (see Step 3).

**`MAILCHAIN_PAGE_SIZE must be a positive integer`**
Check for typos or empty values.

**`ENOENT: no such file or directory, open '.../examples-js/package.json'`**
You are in the repo root. Change into the `extract-messages` folder first: `cd extract-messages`.

**Empty inbox or sent folders**
The script reports when a category has no messages. Confirm you are using the account that actually has mail.

**`Failed to parse message body`**
The message was saved with the raw payload. Open the JSON file and check the `rawBody` field.

## What to do next

- Explore other patterns in [examples-js](https://github.com/mailchain/examples-js) (sending via API, checking addresses, and more).
- Read the [Mailchain developer documentation](https://docs.mailchain.com/) for deeper integration.
