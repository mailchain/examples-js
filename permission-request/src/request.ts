import { mkdirSync, writeFileSync } from 'fs';
import { secureRandom } from '@mailchain/crypto';
import { encodeHex } from '@mailchain/encoding';
import { VerifiablePresentationRequestSender, privateMessagingKeyFromHex } from '@mailchain/sdk/internal';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

async function sendRandomVcRequestMessage() {
	const appPrivateMessagingKeyHex = process.env.APP_PRIVATE_MESSAGING_KEY;
	if (!appPrivateMessagingKeyHex) {
		throw new Error('You must provide APP_PRIVATE_MESSAGING_KEY environment variable');
	}

	const from = process.env.FROM;
	if (!from) {
		throw new Error('You must provide FROM environment variable');
	}

	const to = process.env.TO;
	if (!to) {
		throw new Error('You must provide TO environment variable');
	}

	const appPrivateMessagingKey = privateMessagingKeyFromHex(appPrivateMessagingKeyHex);

	const messageSender = VerifiablePresentationRequestSender.fromSenderMessagingKey(appPrivateMessagingKey);

	const requestId = encodeHex(secureRandom(32));
	const nonce = encodeHex(secureRandom(32));
	const actions = ['Join meeting'];
	const resources = [`meeting/1234`];
	const requestParams = { requestId, nonce, actions, resources, to, verifier: from };

	const { data, error } = await messageSender.sendVerifiablePresentationRequest({
		type: 'MailchainMessagingKeyCredential',
		version: '1.0',
		...requestParams,
		from: requestParams.verifier,
		signedCredentialExpiresAfter: 30 * 24 * 60 * 60, // 30 days,
		requestExpiresAfter: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
		approvedCallback: {
			url: 'http://localhost:3001/callback',
		},
	});

	if (error) {
		throw new Error(`Failure: Error VC Request send ${error}`);
	}
	console.log('Success: VC Request sent', data);

	/** For demo purposes stores the provided params into local storage */
	mkdirSync(`./data`, { recursive: true });
	writeFileSync(`./data/${requestId}.json`, JSON.stringify(requestParams));
	console.log('Success: VC Request saved', requestParams);
}

sendRandomVcRequestMessage();
