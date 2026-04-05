import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MailchainMailboxOperations } = require('@mailchain/internal/mailbox');
const { defaultConfiguration } = require('@mailchain/internal/configuration');
const { KeyRing } = require('@mailchain/keyring');
const { publicKeyToBytes, ED25519PrivateKey } = require('@mailchain/crypto');
const { encodeHex, decodeHexAny } = require('@mailchain/encoding');
const { simpleParser } = require('mailparser');

function createKeyRing() {
	const phrase = process.env.SECRET_RECOVERY_PHRASE;
	const seedHex = process.env.MAILCHAIN_ED25519_SEED_HEX;
	const secretKeyHex = process.env.MAILCHAIN_ED25519_SECRET_KEY_HEX;

	const sources = [phrase && 'SECRET_RECOVERY_PHRASE', seedHex && 'MAILCHAIN_ED25519_SEED_HEX', secretKeyHex && 'MAILCHAIN_ED25519_SECRET_KEY_HEX'].filter(Boolean);

	if (sources.length > 1) {
		throw new Error(`Only one credential source may be set, but found: ${sources.join(', ')}.`);
	}

	if (phrase) {
		return KeyRing.fromSecretRecoveryPhrase(phrase);
	}

	if (seedHex) {
		const bytes = decodeHexAny(seedHex);
		if (bytes.length !== 32) {
			throw new Error(`MAILCHAIN_ED25519_SEED_HEX must decode to 32 bytes (got ${bytes.length}).`);
		}
		return KeyRing.fromPrivateKey(ED25519PrivateKey.fromSeed(bytes));
	}

	if (secretKeyHex) {
		const bytes = decodeHexAny(secretKeyHex);
		if (bytes.length !== 64) {
			throw new Error(`MAILCHAIN_ED25519_SECRET_KEY_HEX must decode to 64 bytes (got ${bytes.length}).`);
		}
		return KeyRing.fromPrivateKey(ED25519PrivateKey.fromSecretKey(bytes));
	}

	throw new Error(
		'No credentials provided. Set one of:\n' +
			'  SECRET_RECOVERY_PHRASE="…"          (24-word mnemonic, recommended)\n' +
			'  MAILCHAIN_ED25519_SEED_HEX="…"      (32-byte hex seed, advanced)\n' +
			'  MAILCHAIN_ED25519_SECRET_KEY_HEX="…" (64-byte hex secret key, advanced)\n' +
			'Use one line: SECRET_RECOVERY_PHRASE="…" npm run get-messages, ' +
			'or run export SECRET_RECOVERY_PHRASE="…" before npm run get-messages.',
	);
}

const pageSize = Number.parseInt(process.env.MAILCHAIN_PAGE_SIZE ?? '25', 10);
if (!Number.isFinite(pageSize) || pageSize <= 0) {
	throw new Error('MAILCHAIN_PAGE_SIZE must be a positive integer');
}

const outputDir = resolve(process.cwd(), process.env.MAILCHAIN_OUTPUT_DIR ?? 'output');

const keyRing = createKeyRing();
const mailboxOperations = MailchainMailboxOperations.create(defaultConfiguration, keyRing, null);

function sanitizeSegment(value, fallback) {
	const replaced = String(value ?? fallback).replace(/[^a-z0-9-_]/gi, '_');
	return replaced.length > 0 ? replaced : fallback;
}

async function fetchAllMessagePreviews(fetchPage) {
	const previews = [];
	let offset = 0;

	while (true) {
		const batch = await fetchPage({ offset, limit: pageSize, userMailboxes: 'all' });
		if (batch.length === 0) break;

		previews.push(...batch);
		offset += batch.length;

		if (batch.length < pageSize) break;
	}

	return previews;
}

async function fetchMessagePayload(messageId) {
	const { data } = await mailboxOperations.inboxApi.getEncryptedMessageBody(messageId, {
		responseType: 'arraybuffer',
	});
	return mailboxOperations.messageCrypto.decrypt(new Uint8Array(data));
}

function toHex(bytes) {
	if (bytes == null) return bytes;
	if (typeof bytes === 'string') return bytes;
	if (bytes instanceof Uint8Array) {
		return `0x${encodeHex(bytes)}`;
	}
	if (ArrayBuffer.isView(bytes)) {
		return `0x${encodeHex(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))}`;
	}
	if (Array.isArray(bytes)) {
		return toHex(Uint8Array.from(bytes));
	}
	if (typeof bytes === 'object') {
		const numericKeys = Object.keys(bytes).filter((key) => /^\d+$/.test(key));
		if (numericKeys.length > 0 && numericKeys.length === Object.keys(bytes).length) {
			numericKeys.sort((a, b) => Number(a) - Number(b));
			const values = numericKeys.map((key) => bytes[key]);
			return toHex(Uint8Array.from(values));
		}
	}
	return bytes;
}

function serializeMailbox(mailbox) {
	if (!mailbox) return mailbox;
	return {
		...mailbox,
		bytes: toHex(publicKeyToBytes(mailbox)),
	};
}

function serializePreview(preview) {
	if (!preview) return preview;
	return {
		...preview,
		mailbox: serializeMailbox(preview.mailbox),
	};
}

function serializeHeaders(headers) {
	if (!headers) return headers;
	const createdValue = headers.Created;
	return {
		...headers,
		ContentSignature: toHex(headers.ContentSignature),
		Origin: serializeMailbox(headers.Origin),
		Created:
			typeof createdValue?.toISOString === 'function'
				? createdValue.toISOString()
				: createdValue,
	};
}

async function processMessages(messagePreviews, category) {
	if (messagePreviews.length === 0) {
		console.log(`No ${category} message(s) found.`);
		return;
	}

	console.log(`Processing ${messagePreviews.length} ${category} message(s).`);
	const categoryDir = join(outputDir, category);
	await mkdir(categoryDir, { recursive: true });

	for (const preview of messagePreviews) {
		const detailedPreview = await mailboxOperations.getMessage(preview.messageId);
		const payload = await fetchMessagePayload(preview.messageId);
		const contentBuffer = Buffer.from(payload.Content);
		const fullBody = contentBuffer.toString('utf8');

		let decodedBody = fullBody;
		let bodyHtml;
		try {
			const parsedBody = await simpleParser(fullBody);
			if (parsedBody?.text) {
				decodedBody = parsedBody.text;
			}
			if (typeof parsedBody?.html === 'string') {
				bodyHtml = parsedBody.html;
			}
		} catch (error) {
			console.warn(`Failed to parse message body for ${preview.messageId}: ${error.message}`);
		}

		const bodyPreviewSource = decodedBody || bodyHtml || fullBody;
		const bodyPreview = bodyPreviewSource.length > 200 ? `${bodyPreviewSource.slice(0, 200)}...` : bodyPreviewSource;

		const ownerDir = join(categoryDir, sanitizeSegment(preview.owner, 'unknown'));
		await mkdir(ownerDir, { recursive: true });

		const baseFileName = sanitizeSegment(preview.messageId, 'message');
		const filePath = join(ownerDir, `${baseFileName}.json`);
		const fullMessage = {
			contentType: payload.Headers.ContentType,
			headers: serializeHeaders(payload.Headers),
			body: decodedBody,
			rawBody: fullBody,
		};
		if (bodyHtml != null) {
			const htmlFileName = `${baseFileName}.html`;
			await writeFile(join(ownerDir, htmlFileName), bodyHtml, 'utf8');
			fullMessage.htmlBodyFile = htmlFileName;
		}
		const fileContents = {
			preview: serializePreview(preview),
			fullMessage,
		};
		await writeFile(filePath, JSON.stringify(fileContents, null, 2), 'utf8');

		console.log('---');
		console.log(`[${category}] Message ID: ${preview.messageId}`);
		console.log(`[${category}] Subject: ${detailedPreview.subject}`);
		console.log(`[${category}] From: ${detailedPreview.from}`);
		console.log(`[${category}] Timestamp: ${detailedPreview.timestamp.toISOString()}`);
		console.log(`[${category}] System labels: ${detailedPreview.systemLabels.join(', ')}`);
		console.log(`[${category}] Snippet: ${detailedPreview.snippet}`);
		console.log(`[${category}] Body preview: ${bodyPreview}`);
		console.log(`[${category}] Saved to: ${filePath}`);
	}
}

async function main() {
	const [inboxPreviews, sentPreviews] = await Promise.all([
		fetchAllMessagePreviews((params) => mailboxOperations.getInboxMessages(params)),
		fetchAllMessagePreviews((params) => mailboxOperations.getSentMessages(params)),
	]);

	console.log(`Fetched ${inboxPreviews.length} inbox message preview(s).`);
	console.log(`Fetched ${sentPreviews.length} sent message preview(s).`);

	await mkdir(outputDir, { recursive: true });

	await processMessages(inboxPreviews, 'inbox');
	await processMessages(sentPreviews, 'sent');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
