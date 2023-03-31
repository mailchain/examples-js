import { resolveAddress } from '@mailchain/sdk/internal';

async function main() {
	const addresses = [
		'epistola.eth@ens.mailchain.com',
		'alice.eth@ens.mailchain.com',
		'bob.eth@ens.mailchain.com',
		'0xbb56FbD7A2caC3e4C17936027102344127b7a112@ethereum.mailchain.com',
	];

	for (const address of addresses) {
		const { data: resolvedAddress, error: resolveAddressError } = await resolveAddress(address);
		if (resolveAddressError) {
			console.warn(
				`ERROR ${address} - not possible to send mail: ${resolveAddressError.type} - ${resolveAddressError.message}`,
			);
			continue;
		}

		if (resolvedAddress.type === 'registered') {
			console.log(`${address} registered - ready to send mail`);
			continue;
		} else if (resolvedAddress.type === 'vended') {
			console.log(`${address} not yet registered - still possible to send mail`);
			continue;
		}
	}
}

main();
