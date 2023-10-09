import { readFileSync } from 'fs';
import express from 'express';
import { MailchainAddressOwnershipVerifier } from '@mailchain/sdk/internal';
const app = express();
const port = 3001;

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/callback', async (req, res) => {
	const { token, requestId } = req.query as { token?: string; requestId?: string };

	if (!token || !requestId) {
		res.status(400).send(`no token or requestId value in query string: ${req.query}`);
		console.error('no token or requestId value in query string:', req.query);
		return;
	}

	const { nonce, to, actions, resources, verifier } = JSON.parse(readFileSync(`./data/${requestId}.json`).toString());

	const addressOwnershipVerifier = MailchainAddressOwnershipVerifier.create();
	const { data, error } = await addressOwnershipVerifier.verifyMailchainAddressOwnership({
		presentation: token,
		verifier,
		nonce,
		address: to,
		actions,
		resources,
	});
	if (error) {
		res.status(400).send(`Error VC Request approval: ${error}`);
		console.error(`Error VC Request approval: ${error}`);
		return;
	}
	res.send(`Successfully verified: ${JSON.stringify(data, null, `\t`)}`);
});

app.listen(port, () => {
	console.log(`Example verification app listening on port ${port}`);
});
