const { Mailchain } = require('@mailchain/sdk');

const secret = process.env.SECRET_RECOVERY_PHRASE;
if (!secret || secret.length === 0) {
	throw new Error('SECRET_RECOVERY_PHRASE environment variable not set');
}
const mailchain = Mailchain.fromSecretRecoveryPhrase(secret, undefined, {
	apiPath: 'https://api.mailchain.dev',
	mailchainAddressDomain: 'mailchain.dev',
	nearRpcUrl: 'https://rpc.testnet.near.org',
});

mailchain.user().then((user) => {
	mailchain
		.sendMail({
			from: user.address,
			to: [user.address],
			subject: `Hello ${user.username}`,
			content: {
				text: `Hello ${user.username}`,
				html: `<p>Hello ${user.username}</p>`,
			},
		})
		.then((sendResult) => {
			if (sendResult.error) throw sendResult.error;
			console.log(sendResult.data);
		});
});
