# Exporting messages with an Ed25519 key

This guide is for people who have a **hex key** instead of a 12 or 24 word Secret Recovery Phrase. If your credential looks something like this:

```
f910161d9bfb3217e81f7bbcd8dcb8ca86efdd7801052edad18d402282cd6000
```

then this guide is for you. If you have a phrase made of words, follow the [standard tutorial](TUTORIAL.md) instead.

## Background: two types of hex key

There are two formats you might have:

| What you have | Length | Description |
|---------------|--------|-------------|
| **Seed** | 64 hex characters (32 bytes) | The root material the key is derived from |
| **Secret key** | 128 hex characters (64 bytes) | The full Ed25519 private key |

Count the characters in your hex string to know which one you have. A leading `0x` does not count — `0x6164...` and `6164...` are the same value.

## What you need

- **Node.js 18 or newer** — download from [nodejs.org](https://nodejs.org)
- Your hex key (seed or secret key)

Keep your hex key private. It gives full access to your Mailchain identity. Do not share it or paste it into chat.

## Step 1: Download the code

```bash
git clone https://github.com/mailchain/examples-js.git
cd examples-js/extract-messages
```

## Step 2: Install packages

```bash
npm install
```

## Step 3: Export your messages

Pick the command that matches your key type.

**If you have a seed (64 hex characters):**

```bash
MAILCHAIN_ED25519_SEED_HEX="your-hex-here" npm run get-messages
```

**If you have a secret key (128 hex characters):**

```bash
MAILCHAIN_ED25519_SECRET_KEY_HEX="your-hex-here" npm run get-messages
```

The script will fetch, decrypt, and save all your inbox and sent messages.

## Step 4: Find your files

Messages are saved in an `output` folder:

```
output/
  inbox/    ← your received messages
  sent/     ← your sent messages
```

Each message is a `.json` file. If a message contained HTML, there will also be a `.html` file alongside it.

## Something went wrong?

**`Only one credential source may be set`**
You set more than one credential variable. Use only one of `MAILCHAIN_ED25519_SEED_HEX`, `MAILCHAIN_ED25519_SECRET_KEY_HEX`, or `SECRET_RECOVERY_PHRASE`.

**`must decode to 32 bytes` or `must decode to 64 bytes`**
Your hex string is the wrong length for the variable you used. Count the characters: 64 hex characters is a seed, 128 is a secret key.

**`ENOENT: no such file or directory, open '.../package.json'`**
You are in the wrong folder. Run `cd extract-messages` first, then try again.

**The output folder is empty**
The script prints "No inbox message(s) found" or similar if there is nothing to export. Make sure you are using the account that has messages.
