var MagicLinkStrategy = require('passport-magic-link').Strategy;
var { Mailchain } = require('@mailchain/sdk');
var passport = require('passport');
var db = require('./db');

var mailchain = Mailchain.fromSecretRecoveryPhrase(process.env.SECRET_RECOVERY_PHRASE);

const createMailchainAddress = function (address) {
	switch (address) {
		case address.match(/^[\d\w\-\_]*@mailchain\.com$/)?.input: // Mailchain address:
			return address;
		case address.match(/^0x[a-fA-F0-9]{40}$/)?.input: // Ethereum address:
			return address + '@ethereum.mailchain.com';
		case address.match(/^.*\.eth$/)?.input: // ENS address:
			return address + '@ens.mailchain.com';
		case address.match(/^.*\.*@mailchain$/)?.input: // Mailchain address without .com:
			return address + '.com';
		default:
			console.error('Invalid address');
	}
};

function initializeMagicLink() {
	passport.use(
		new MagicLinkStrategy(
			{
				secret: process.env.SECRET_PASSPORT_SESSION_KEY,
				userFields: ['mailchain_address'],
				tokenField: 'token',
				verifyUserAfterToken: true,
			},
			async (user, token) => {
				var link = 'http://localhost:3000/login/mailchain/verify?token=' + token;

				var msg = {
					to: [createMailchainAddress(user.mailchain_address)],
					from: process.env.FROM_ADDRESS,
					subject: 'Sign in to Todos',
					content: {
						text: 'Hello! Click the link below to finish signing in to Todos.\r\n\r\n' + link,
						html:
							'<h3>Hello!</h3><p>Click the link below to finish signing in to Todos.</p><p><a href="' +
							link +
							'">Sign in</a></p>',
					},
				};
				const { data, error } = await mailchain.sendMail(msg);
				if (error) {
					throw new Error('Mailchain error', { cause: error });
				}
				console.log('sent mail', data);
				return data;
			},
			(user) => {
				return new Promise((resolve, reject) => {
					db.get('SELECT * FROM users WHERE mailchain_address = ?', [user.mailchain_address], (err, row) => {
						if (err) {
							return reject(err);
						}
						if (!row) {
							db.run(
								'INSERT INTO users (mailchain_address, mailchain_address_verified) VALUES (?, ?)',
								[user.mailchain_address, 1],
								function (dbErr) {
									if (dbErr) {
										return reject(dbErr);
									}
									var id = this.lastID;
									var obj = {
										id,
										mailchain_address: user.mailchain_address,
									};
									return resolve(obj);
								},
							);
						} else {
							return resolve(row);
						}
					});
				});
			},
		),
	);

	passport.serializeUser((user, cb) => {
		process.nextTick(() => {
			cb(null, { id: user.id, mailchain_address: user.mailchain_address });
		});
	});

	passport.deserializeUser((user, cb) => {
		process.nextTick(() => {
			return cb(null, user);
		});
	});
}

module.exports = initializeMagicLink;
