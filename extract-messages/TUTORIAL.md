# How to export your Mailchain messages

This guide shows you how to download all your Mailchain inbox and sent messages to your computer as files you can open and read.

You need a Mailchain account and a terminal. No blockchain experience required.

## What you need

- **Node.js 18 or newer** — download from [nodejs.org](https://nodejs.org)
- Your **Secret Recovery Phrase** — the 12 or 24 words you were given when you set up your Mailchain account

Keep your Secret Recovery Phrase private. Do not share it or paste it into chat. To find it in your account settings, see the [Secret Recovery Phrase guide](https://docs.mailchain.com/user/guides/settings/secret-recovery-phrase/).

## Step 1: Download the code

Open your terminal and run:

```bash
git clone https://github.com/mailchain/examples-js.git
cd examples-js/extract-messages
```

## Step 2: Install packages

```bash
npm install
```

Wait for it to finish. You will see some output about packages being added.

## Step 3: Export your messages

Replace the placeholder words with your actual Secret Recovery Phrase and run the whole line as one command:

```bash
SECRET_RECOVERY_PHRASE="word1 word2 word3 ..." npm run get-messages
```

The script will fetch your inbox and sent messages, decrypt them, and save each one as a file. You will see output in the terminal for each message as it is saved.

## Step 4: Find your files

Your messages are saved in an `output` folder inside `extract-messages`:

```
output/
  inbox/    ← your received messages
  sent/     ← your sent messages
```

Each message is a `.json` file. If a message contained HTML (like a newsletter), there will also be a `.html` file alongside it that you can open in a browser.

## Something went wrong?

**`No credentials provided`**
Make sure your Secret Recovery Phrase is on the same line as `npm run get-messages`, not on a separate line before it.

**`ENOENT: no such file or directory, open '.../package.json'`**
You are in the wrong folder. Run `cd extract-messages` first, then try again.

**The output folder is empty**
The script prints "No inbox message(s) found" or similar if there is nothing to export. Make sure you are using the account that has messages.

---

If your Secret Recovery Phrase is a hex string (for example `f910161d9bfb3217e81f7bbcd8dcb8ca86efdd7801052edad18d402282cd6000`) rather than a series of words, see the [Ed25519 key tutorial](TUTORIAL-ED25519.md).
