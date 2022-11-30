import { Mailchain, SendMailParams, SendMailResult } from '@mailchain/sdk';

class MailService {
	async send(params: SendMailParams): Promise<SendMailResult> {
		const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE;

		if (secretRecoveryPhrase == null) {
			throw new Error('You must provide a secret recovery phrase');
		}
		const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

		if (!params.from || params.from === '') {
			// set the from address to current user if not provided
			const currentUser = await mailchain.user();
			params.from = currentUser.address;
		}

		return await mailchain.sendMail(params);
	}
}

export default MailService;
