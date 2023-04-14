# On-chain voting tool dApp

This dApp serves as the user interface for deploying, managing and interacting with voting rounds on the Algorand blockchain. To run the dApp, you need to connect it to an Algorand network and an https gateway to the IPFS, which can both be configured in the `.env` file. The Algorand network is necessary for deploying the voting round smart contracts and managing voting transactions, while the IPFS gateway is needed for storing and accessing metadata related to voting rounds.

This project contains a [write-through cache Algorand IPFS gateway](../voting-metadata-api/README.md) which can serve as the IPFS gateway.

[AlgoKit](https://github.com/algorandfoundation/algokit-cli#install) can be use to easily start an Algorand LocalNet network.

The dApp is implemented using:

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [MUI](https://mui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [AlgoKit Utils](https://github.com/algorandfoundation/algokit-utils-ts)
- [use-wallet](https://github.com/TxnLab/use-wallet)

## Initial setup

1. Copy `.env.template` to `.env`
2. `npm install`
3. `npm run dev`
