import { useState } from 'react';
import { Mailchain } from '@mailchain/sdk';

function App() {
	const [secret, setSecret] = useState('');
	return (
		<div>
			<input
				placeholder="Secret Recovery Phrase"
				value={secret}
				onChange={async (e) => setSecret(e.target.value)}
			/>
			<button
				onClick={async () => {
					const mailchain = Mailchain.fromSecretRecoveryPhrase(secret);

					const user = await mailchain.user();
					const sendResult = await mailchain.sendMail({
						from: user.address,
						to: [user.address],
						subject: `Hello ${user.username}`,
						content: {
							text: `Hello ${user.username}`,
							html: `<p>Hello ${user.username}</p>`,
						},
					});

					alert(JSON.stringify(sendResult, null, 2));
				}}
			>
				Send 💌
			</button>
		</div>
	);
}

export default App;
