/* eslint-disable no-undef */
import { Mailchain } from '@mailchain/sdk';

document.querySelector('#app').innerHTML = `
  <div>
	<input id="secret"/>
	<button id="send" type="button">Send 💌</button>
  </div>
`;

const sendButton = document.querySelector('#send');
sendButton.addEventListener('click', async () => {
	const secret = document.querySelector('#secret').value;

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
});
