# On-chain voting tool for xGov

This dApp serves as the user interface for deploying, managing and interacting with xGov voting rounds on the Algorand blockchain. To run the dApp, you need to connect it to an Algorand network and an https gateway to the IPFS, which can both be configured in the `.env` file. The Algorand network is necessary for deploying the voting round smart contracts and managing voting transactions, while the IPFS gateway is needed for storing and accessing metadata related to voting rounds.

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
4. Visit <http://localhost:5174/>

## Creating a round

1. Navigate to `/create`
2. Enter a title, optional description, optional url, start and end date for the voting period, proposals (see below), snapshot (see below) and optional quorum
3. Next -> Review
4. Create voting round -> Sign a series of 3 x transactions in a row
   - Note: all values are immutable once the contract is created

## Proposal CSV

The proposal CSV contains the following columns:

- `title` - The title of the proposal
- `description` - A short description of the proposal
- `link` - A URL to get more information about the proposal
- `category` - The category of the proposal
- `focus_area` - The focus area of the proposal
- `threshold` - The threshold value beyond which the idea is considered fully funded
- `ask` - The ask amount of the proposal

### Setting an abstain bucket when people don't have any extra votes to allocate

You can include a proposal with a category of `Abstain` and set the `ask` and `threshold` values to `0`. The voting UI will handle this and show it distinctly.

### Example

```csv
"title","description","link","category","focus_area","threshold","ask"
"dApp Proposal 1","This is a proposal for a new decentralized application","https://example.com/proposal1","dApps","Education",110000,50000
"Tool Proposal 1","This is a proposal for a new tool","https://example.com/proposal2","Tools","Gaming",50000,20000
"Community Proposal 1","This is a proposal for a new community initiative","https://example.com/proposal3","Community","Identity",2200000,100000
"Mock Proposal","This is a mock proposal","link","Abstain","focus",0,0
```

## Snapshot CSV

Here's an example CSV file. Note: if testing locally, be sure to include the address(es) of the wallet(s) you are using so you can participate in the vote (or not if you are testing what happens when you aren't on the snapshot).

```csv
address,weight
ALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU,10000
ODTX32FQL44D5GIJ2CMCEZ4G3FGUU3WUYDHJZDRNSSLHDO54ESGKXC25UQ,1000000
P4DJ2EWDGHX4NIZOGB3Q5BG6ZMBKJKYBY3L43V6SINXGCNJLMBLKLF4MHE,90000
F5NJTY56OEXHMVFLDMPNZFWZWJDKYZNOX3RBYCVPIZ3YNIOBJ6FWLPSS2I,12000
Q5MDKPB7IYAJG7IG73ZKHZSTSJCT53QTORBCMZIW2AWLHPOYNCHBOUSKEM,110000
```

Note: The CSV validation is pretty advanced so should stop most common errors from occurring (e.g. invalid address, invalid row, lack of named column, etc.). Note: the validation will complain about an empty line at the end of the file as an empty row.
