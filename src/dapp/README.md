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
3. `npm run dev`, or, in VS Code run the `Run dApp` Run and Debug configuration
4. Visit <http://localhost:5173/>

## Creating a round

1. Navigate to `/create`
2. Enter a title, vote type, description, optional url, start and end date for the voting period, snapshot (See below) and optional quorum

   - Vote type can either be:

     - `NO_WEIGHTING`: Which means every voter has 1 vote (i.e. all votes are treated equally) - in this case the snapshot file needs to be a single column CSV file with a header of `address` with the voter account address on each row
     - `WEIGHTING`: Which means every voter has an allocated weighting - in this case the snapshot file needs to be a two-column CSV file with the voter account address in the first column (and a header of `address`) and the numeric weight of their vote in the second column (and a header of `weight`)

3. Next -> Add questions and options
4. Next -> Review
5. Create voting round -> Sign a series of 3 x transactions in a row
   - Note: all values are immutable once the contract is created

## Snapshot CSV

Here's an example CSV file (with weight included, which is not required if the voting type is `NO_WEIGHTING`). Note: if testing locally, be sure to include the address(es) of the wallet(s) you are using so you can participate in the vote (or not if you are testing what happens when you aren't on the snapshot).

```csv
address,weight
ALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU,10000
ODTX32FQL44D5GIJ2CMCEZ4G3FGUU3WUYDHJZDRNSSLHDO54ESGKXC25UQ,1000000
P4DJ2EWDGHX4NIZOGB3Q5BG6ZMBKJKYBY3L43V6SINXGCNJLMBLKLF4MHE,90000
F5NJTY56OEXHMVFLDMPNZFWZWJDKYZNOX3RBYCVPIZ3YNIOBJ6FWLPSS2I,12000
Q5MDKPB7IYAJG7IG73ZKHZSTSJCT53QTORBCMZIW2AWLHPOYNCHBOUSKEM,110000
```

Note: The CSV validation is pretty advanced so should stop most common errors from occurring (e.g. invalid address, invalid row, lack of named column, etc.). Note: the validation will complain about an empty line at the end of the file as an empty row.
