# On-chain voting design

- **Status**: Draft
- **Owner:** Rob Moore
- **Deciders**: Rob Moore (MakerX), Richard Watts-Seale (MakerX), Alessandro Cappellato (Algorand Foundation), Stephane Barroso (Algorand Foundation), Benjamin Guidarelli (Algorand Foundation)
- **Date created**: 2023-03-02
- **Date decided:** TBD
- **Date updated**: 2023-03-02

## Context

The Algorand Foundation aims to establish a long term, mutually beneficial relationship with the Algorand NFT ecosystem, stakeholders and community through a series of initiatives to advance the utility and support the growth of the Algorand NFT ecosystem by establishing an NFT Council. A required capability for the establishment is an on-chain voting tool to facilitate transparent community decision making.

The Algorand Foundation would like the on-chain voting tool not only for the NFT Council election but also for a more effective decision-making process across other NFT-related initiatives in the future and available as Open Source Software so the rest of the community can benefit from it.

This decision record articulates the different design considerations of this on-chain voting tool and the design that has been selected along with the rationale for that selection.

## Terminology

* **Account** - A single blockchain account (colloquially referred to as a wallet), which is secured by a private key and identified by a public key
* **Vote caster** - An actor who can place a vote, this would be represented by a single account within an on-chain voting context
* **Vote creator** - An actor which wants to create an opportunity for vote casters to vote
* **Voting round** - A discrete opportunity for vote casters to participate in a vote for a given context
* **Vote gating** - Restricting who can participate as a vote caster within a voting round
* **Vote weighting** - Allocating a relative quantity or "weighting" of votes that an individual vote caster can exercise as part of participating in a voting round
* **Vote delegation** - A vote creator can pass on their voting power to a different actor to cast a vote on their behalf (note: this is not an explicit requirement of the voting tool as it stands)
* **Snapshot** - A list of accounts based on some set of criteria
* **Snapshot index** - The order-dependant, zero-based index of a given account within a snapshot
* **Vote gating and weighting metadata** - A metadata document that contains all of the data needed to specify the gating and weighting for a voting round for a given snapshot 
* **Voting round metadata** - A metadata document that contains all of the data that specifies the configuration of a voting round
* **Confidential server** - A trusted backend server that can keep a secret secure, naturally this is a centralised element
* **Vote registration** - The moment in time that a vote caster decides they will participate in voting (this may or may not result in a specific action within the user experience depending on the selected design)
* **Vote casting** - The moment in time that a vote caster performs their vote
* **Vote closure** - The moment in time that a vote caster wants to close our their vote (after the voting round is closed) and reclaim any ALGO that is locked or any other required clean up (this may or may not result in a specific action within the user experience depending on the selected design)

## Requirements

- Vote creators can create voting rounds
- Vote casters can participate in a voting round
- Vote creators can specify a snapshot of accounts that then gate access to participate in the voting round
- Vote creators can optionally specify a vote "weighting" for snapshotted accounts

## Principles

- **Integrity and transparency** - The end-to-end process utilises immutable, tamperproof records to prove vote creation and casting integrity and provide a high degree of transparency around the voting process and result
- **Decentralised** - The end-to-end process aims to make as much of the voting process decentralised as possible, which aligns to the ethos of the Algorand community, allows for use in voting situations where it's desirable to not allow a centralised party to have control, enhances the integrity and transparency (not relying on a centralised party to orchestrate the vote), shows off the power of the technology and simplifies the infrastructure deployment of the overall solution making it more accessible
- **Targeted, but flexible** - The implementation of the voting tool is targeted towards the initial use case of NFT Council, but is designed to be as flexible as possible within reasonable time and complexity constraints so it's broadly useful for other use cases within Algorand Foundation and the broader community
- **Open Source** - The source code of the voting tool is made Open Source so it's broadly accessible and usable by the Algorand community

## Capabilities

There are a series of capabilities that need to be implemented by the voting tool that each have design considerations and options.

## Capability: Vote gating

Vote gating is complex to implement on a blockchain because storage space is limited / expensive and a snapshot could consist of tens or even hundreds of thousands of account addresses.

A number of options were devised for how vote gating could be implemented.

### Option VG1 - Fungible voting token

A fungible "**voting token**" is issued for each voting round to mark eligibility to participate in that vote. A snapshot can be facilitated by having a confidential server that has a mnemonic that lets it transfer tokens to an account after it opts-in to receive the voting token and issues a request to receive its token allocation.

The voting token can also be used for vote weighting by transferring the weight of votes as the transferred quantity of the voting token.

The voting smart contract can enforce vote gating by looking at the balance of the voting token and require a balance that is greater than zero. To prevent an account voting multiple times the smart contract can require a transaction group with a transfer of the accounts entire balance of voting tokens to the reserve account or issue an inner transaction if set as the clawback. To prevent an account claiming tokens multiple times the confidential server can keep state of which accounts have already had their voting tokens allocated.

**Pros**

- Allows people to delegate their voting power by transferring their voting tokens to another party
- Smart contract code is simple to implement
- No confidential server required at vote casting

**Cons**

- Requires a confidential server to be present at vote registration (reduces decentralisation)
- Requires vote casters to opt-in to the voting token at vote registration, then a separate transaction at voting time, adding to the complexity of the user experience
- Account has additional ALGO minimum balance requirement for the voting token, requiring transactions to clean up after the vote, adding to the complexity of the user experience
- If you don't want to support vote delegation then freezing and clawback will need to be used on the voting token requiring either a confidential server to be present at vote closure or the smart contract to be set as the clawback account (added complexity)

### Option VG2 - Fungible snapshot token

A fungible "**snapshot token**" is issued for each snapshot to mark snapshot membership. A snapshot can be facilitated by having a confidential server that has a mnemonic that lets it transfer tokens to an account after it opts-in to receive the snapshot token and issues a request to receive its token allocation.

The voting token can also be used for vote weighting by transferring the weight of votes as the transferred quantity of the snapshot token.

The voting smart contract can enforce vote gating by looking at the balance of the voting token and require a balance that is greater than zero.

To prevent an account voting multiple times the smart contract can store a value in box storage, keyed by the account address of the vote caster.

To prevent an account claiming tokens multiple times the confidential server can keep state of which accounts have already had their voting tokens allocated.

**Pros**

- Allows people to delegate their voting power by transferring their voting tokens to another party
- Smart contract code is simple to implement
- No confidential server required at vote casting
- Less transactions / complexity required compared to voting token since the token doesn't need to be clawed back

**Cons**

- While delegated voting power is possible, it's not possible to delegate for a single voting round, only all voting rounds for a given snapshot (unless some sort of smart contract is created to facilitate controlled delegation)
- Requires either vote creator or vote caster to lock up ALGOs for minimum balance requirement of box storage, which introduces clean up complexity at vote closure
- Requires a confidential server to be present at first vote registration for each snapshot (reduces decentralisation)
- Requires vote casters to opt-in to the voting token at first vote registration for each snapshot, adding to the complexity of the user experience
- Account has additional ALGO minimum balance requirement for the snapshot token, requiring transactions to clean up after the last vote that uses a snapshot (and it won't be clear to a vote caster when that is), adding to the complexity of the user experience

### Option VG3 - Local storage

Vote casters opt-in to the voting round smart contract and a confidential server signs a transaction that sets local storage values for the vote caster indicating voting eligibility and vote weighting.

The voting smart contract can enforce vote gating by ensuring the local storage eligibility value has been set.

To prevent an account voting multiple times the smart contract can store the vote answers in local storage and ensure they have not been set yet when accepting a vote. To prevent an account voting multiple times by clearing their local state, the smart contract can subtract the answer(s) from the overall tallies if a user clears state or opts-out of the smart contract so that their vote is nullified.

**Pros**

- No confidential server required at vote casting
- Local storage is simple to use and account for

**Cons**

- Use of local storage will provide limitations on the number of questions that can be answered as part of casting a vote
- Opting-in to the smart contract requires a lifted minimum balance requirement for the vote itself, which adds complexity to the user experience of vote closure to clean up
- Delegated voting is not possible
- Requires smart contract complexity to handle opt-out and clearstate
- Requires additional transaction at vote registration to opt in, adding to the complexity of the user experience
- Requires a confidential server to be present at vote registration (reduces decentralisation)

### Option VG4 - Box storage

A confidential server signs a transaction that sets box storage values for the vote caster keyed against their account address indicating voting eligibility and vote weighting. This can be done either directly after smart contract creation for every account in the snapshot, or can be done on-demand as part of vote registration.

The voting smart contract can enforce vote gating by ensuring the box storage eligibility value has been set for the vote caster.

To prevent an account voting multiple times the smart contract can store the vote answers in box storage and ensure they have not been set yet when accepting a vote.

To ensure minimum balance requirement is catered for box storage the vote creator can send enough ALGOs to cover all possible box storage use for the maximum number of voters to the smart contract account after smart contract creation. This would then require the deletion of the boxes at vote closure (which could take many transactions depending on the number of votes) and a transfer of the ALGOs back to the vote creator.

**Pros**

- No confidential server required at vote casting (or vote registration if entire snapshot is added after smart contract creation)
- Simplest vote caster experience and simplest dApp implementation

**Cons**

- Requires vote creator to lock up significant number of ALGOs for minimum balance requirement of box storage and has significant clean up complexity at vote closure (lots of transactions needed to delete box storage)
- Delegated voting is not easily possible (you could implement delegation using box storage, but it's complex to implement)
- Requires either:
   - Significant number of transactions after the smart contract is created (slow, expensive, but no confidential server required)
   - Additional request / transaction at vote registration, adding to the complexity of the user experience and requires confidential server (reduces decentralisation)
- Significant ALGO lock-up necessitates deletion of box storage / app after vote closure, which means the stored data is lost and necessitates reconstruction from raw historical transactions if the historical state is needed 

### Option VG5 - Merkle tree

Snapshots are converted into a Merkle tree (using Keccak256 hashing) from leaf nodes that have the hash of: `{account address - 32 bytes}{voting weight - 4 bytes}{snapshot index - 4 bytes}` and this Merkle tree is stored, along with the original list of account address, voting weight and snapshot index combination, in a vote gating and weighting metadata record in a referenceable, retrievable and ideally tamperproof form (e.g. via IPFS). When the voting round smart contract is created the Merkle root and vote gating and weighting metadata record reference are stored in a known location (e.g. in global state or box storage).

When a vote caster casts their vote, their vote answers will be provided along with their voting weight, snapshot index and a Merkle proof for their corresponding leaf node in the Merkle tree. The smart contract will perform vote gating by verifying the Merkle proof is intact against the original Merkle root. Verifying the Merkle root also allows the voting weight number to be trusted and used.

To prevent an account voting multiple times the smart contract can store a bit corresponding to the snapshot index within a known box storage key and ensure this has not already been set yet when accepting a vote. For example, if the snapshot index is 3 (i.e. position 4) there are 8 accounts in the snapshot (i.e. there 8 bits are needed and thus a 1 byte box is allocated) and the existing value is before voting `00001000` then after voting the box value will be `00011000` and a subsequent attempt by that account to vote will fail. Using bit-wise logic means that the amount of box storage needed to record vote participation is limited, which reduces the ALGO minimum balance requirement and complexity of clean up at vote closure.

To ensure minimum balance requirement is catered for box storage the vote creator can send enough ALGOs to cover storing the participation bits for the number of potential voters in the snapshot.

**Pros**

- No confidential server required after voting round smart contract creation (i.e. fully decentralised)
- Low storage requirement, low minimum balance requirement, relatively low clean up complexity
- Simple vote caster experience

**Cons**

- Complex smart contract logic (Merkle proof validation, opup required to get more opcode budget for Keccak256 hashing, bitwise participation get and set logic), snapshot logic (Merkle tree creation), and dApp logic (Merkle proof calculation) required
- Application args are complex (lining up passthrough of Merkle proof and loading correct box storage for bitwise logic)
- Delegated voting is not easily possible (you could implement delegation using box storage, but it's complex to implement)

### Preferred option

Option VG5 - Merkle tree.

It's the most elegant solution that provides a great user experience, a truly decentralised voting mechanism without need for a confidential server, relatively easy clean up.

Requires spike to ensure viable implementation is possible, but initial feeling is this is the case. If it's not then the option is Option VG4 - Box storage since it is reasonable decentralised and has a great user experience and simple dApp implementation.

### Selected option

Option VG5 - Merkle tree.


## Capability: Metadata storage

Voting round metadata and vote gating and weighting metadata storage
Vote listings
authenticity

todo: S3 vs IPFS


## Capability: Tallying

todo: global vs box and single v multiple questions
