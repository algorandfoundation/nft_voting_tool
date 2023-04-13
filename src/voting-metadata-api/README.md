# Algorand authorised IPFS write-through cache gateway

This is an [IPFS](https://docs.ipfs.tech/concepts/what-is-ipfs/) Gateway that has the following functionality:

- Publicly available `GET` API at `/ipfs/{cid}` (where `{cid}` is an [IPFS Content Identifier](https://docs.ipfs.tech/concepts/how-ipfs-works/#how-ipfs-represents-and-addresses-data)) that will:
  - Check if the data for that request is present in the cache (local: filesystem in `.cache`, deployed: AWS S3 storage) and if so return that
  - Proxy the request to the Cloudflare public IPFS gateway
- Algorand account allow-listed `POST` API at `/ipfs` that will:
  - Allow an authorised account to attach a HTTP header with `Authorize: Algorand {signed_transaction}` where `{signed_transaction}` is a base 64 encoded `SignedTransaction` object, which has a valid signature from one of the allow-listed accounts
    - Note: Rekeyed accounts are not supported, since the signature is checked offline, so the allowlist needs to be changed if you need to change the private key(s)
  - Accept a file under the `file` property in the request body
  - Take the given file, save it to the cache (e.g. S3 in the deployed environment) and then send that file through to [Web3.Storage](https://web3.storage/) via a configured API key so it will be pinned and present via the IPFS network

This component allows for easy deployment of a high performance IPFS gateway that has the advantages of IPFS (decentralised access, tamperproof immutability and, while pinned, permanence), without the usual downsides (slow, unreliable requests resulting in poor user experience).

# Initial setup

1. Copy `.env.template` to `.env`
2. `npm run install`
3. `npm run dev`, or, in VS Code run the `Run api` Run and Debug configuration
