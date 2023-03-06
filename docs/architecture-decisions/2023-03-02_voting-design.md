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
* **Voting round creator** - An actor which wants to create an opportunity for vote casters to vote
* **Question** - A prompt that raises a statement for a vote caster to consider and submit an answer to as part of casting a vote
* **Voting round** - A discrete opportunity for vote casters to participate in a vote for a given context, this may consist of one or more questions
* **Vote gating** - Restricting who can participate as a vote caster within a voting round
* **Vote weighting** - Allocating a relative quantity or "weighting" of votes that an individual vote caster can exercise as part of participating in a voting round
* **Vote delegation** - A vote caster can pass on their voting power to a different actor to cast a vote on their behalf (note: this is not an explicit requirement of the voting tool as it stands)
* **Snapshot** - A list of accounts based on some set of criteria
* **Snapshot index** - The order-dependant, zero-based index of a given account within a snapshot
* **Vote gating and weighting metadata** - A metadata document that contains all of the data needed to specify the gating and weighting for a voting round for a given snapshot 
* **Voting round metadata** - A metadata document that contains all of the data that specifies the configuration of a voting round
* **Confidential server** - A trusted backend server that can keep a secret secure, naturally this is a centralised element
* **Vote registration** - The moment in time that a vote caster decides they will participate in voting (this may or may not result in a specific action within the user experience depending on the selected design)
* **Vote casting** - The moment in time that a vote caster performs their vote
* **Vote closure** - The moment in time that a vote caster wants to close our their vote (after the voting round is closed) and reclaim any ALGO that is locked or any other required clean up (this may or may not result in a specific action within the user experience depending on the selected design)

## Requirements

- Voting round creators can create voting rounds
- Vote casters can participate in a voting round
- Voting round creators can specify a snapshot of accounts that then gate access to participate in the voting round
- Voting round creators can optionally specify a vote "weighting" for snapshotted accounts

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
- Requires either voting round creator or vote caster to lock up ALGOs for minimum balance requirement of box storage, which introduces clean up complexity at vote closure
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

To ensure minimum balance requirement is catered for box storage the voting round creator can send enough ALGOs to cover all possible box storage use for the maximum number of voters to the smart contract account after smart contract creation. This would then require the deletion of the boxes at vote closure (which could take many transactions depending on the number of votes) and a transfer of the ALGOs back to the voting round creator.

**Pros**

- No confidential server required at vote casting (or vote registration if entire snapshot is added after smart contract creation)
- Simplest vote caster experience and simplest dApp implementation

**Cons**

- Requires voting round creator to lock up significant number of ALGOs for minimum balance requirement of box storage and has significant clean up complexity at vote closure (lots of transactions needed to delete box storage)
- Delegated voting is not easily possible (you could implement delegation using box storage, but it's complex to implement)
- Requires either:
   - Significant number of transactions after the smart contract is created (slow, expensive, but no confidential server required)
   - Additional request / transaction at vote registration, adding to the complexity of the user experience and requires confidential server (reduces decentralisation)
- Significant ALGO lock-up necessitates deletion of box storage / app after vote closure, which means the stored data is lost and necessitates reconstruction from raw historical transactions if the historical state is needed 

### Option VG5 - Merkle tree

Snapshots are converted into a Merkle tree (using Keccak256 hashing) from leaf nodes that have the hash of: `{account address - 32 bytes}{voting weight - 4 bytes}{snapshot index - 4 bytes}` and this Merkle tree is stored, along with the original list of account address, voting weight and snapshot index combination, in a vote gating and weighting metadata record in a referenceable, retrievable and ideally tamperproof form (e.g. via IPFS). When the voting round smart contract is created the Merkle root and vote gating and weighting metadata record reference are stored in a known location (e.g. in global state or box storage).

When a vote caster casts their vote, their vote answers will be provided along with their voting weight, snapshot index and a Merkle proof for their corresponding leaf node in the Merkle tree. The smart contract will perform vote gating by verifying the Merkle proof is intact against the original Merkle root. Verifying the Merkle root also allows the voting weight number to be trusted and used.

To prevent an account voting multiple times the smart contract can store a bit corresponding to the snapshot index within a known box storage key and ensure this has not already been set yet when accepting a vote. For example, if the snapshot index is 3 (i.e. position 4) there are 8 accounts in the snapshot (i.e. there 8 bits are needed and thus a 1 byte box is allocated) and the existing value is before voting `00001000` then after voting the box value will be `00011000` and a subsequent attempt by that account to vote will fail. Using bit-wise logic means that the amount of box storage needed to record vote participation is limited, which reduces the ALGO minimum balance requirement and complexity of clean up at vote closure.

To ensure minimum balance requirement is catered for box storage the voting round creator can send enough ALGOs to cover storing the participation bits for the number of potential voters in the snapshot.

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

There are two key metadata documents that will be referenced by the voting tool:

* **Vote gating and weighting metadata** - A metadata document that contains all of the data needed to specify the gating and weighting for a voting round for a given snapshot 
* **Voting round metadata** - A metadata document that contains all of the data that specifies the configuration of a voting round

While some of the metadata will be stored on-chain within the voting round smart contract, some of it will be too expensive or simply not useful to store on-chain, but will need to be retrieved as part of any dApp that displays a read and/or write interface for voting.

There are two key approaches that could be used for this:

* **InterPlanetary File System (IPFS)** - Storing the JSON blobs as an immutable content-addressable hash within IPFS
* **Cloud blob storage** - Storing the JSON blobs within a cloud blob storage such as Amazon S3 and exposed directly or via an API

### Option MS1 - IPFS

**Pros**

- Immutability is guaranteed by the content-addressable storage
- Permanence can be ensured by any party that is happy to continue to pay to pin the content
- Decentralised - doesn't require DNS/AWS/API to be maintained to continue be retrievable
- Immutability of content means it's relatively easy to implement in-browser caching too so subsequent visits a user makes to the voting page can load faster

**Cons**

- Requires a confidential server to perform the upload (or and end user to provide an IPFS service upload key, which is not a good user experience, particularly for less technical voting round creators, and requires in browser secret handling)
- Relies on the AWS bill, DNS and potentially API deployment to be maintained for the metadata to be retrieved into the future (doesn't comply with the decentralisation principle)
- IPFS performance is often slow and unreliable (although the download performance can be offset by an IPFS gateway with a write-through cache to high performance blob storage like Amazon S3)


### Option MS2 - Cloud blob storage

**Pros**

- It's possible to use shared access signatures / pre-signed URLs to delegate the ability to upload content to the storage from the frontend application (reducing the amount of execution needed on a confidential server)
- Fast performance for upload and download

**Cons**

- Immutability isn't guaranteed, so the metadata isn't tamperproof
- Relies on the AWS bill, DNS and potentially API deployment to be maintained for the metadata to be retrieved into the future (doesn't comply with the decentralisation principle)

### Preferred option

Option MS1 - IPFS.

It's the solution that conforms best to the principles of **Integrity and transparency** and **Decentralised** and it's similarly **flexible** as Option MS2 (outside of mutable snapshotting, which itself won't work with the Merkle root implementation of vote gating anyway). The performance and reliability issues with IPFS can easily be solved with a write-through cache gateway so the user experience is slick (and can be combined with browser caching too).

### Selected option

Option MS1 - IPFS.


## Capability: Tallying and result determination

Any voting process will naturally need individual votes to be tallied and an algorithm applied to determine the result. There are a number of tallying options that could be implemented, which are described below. 

The options for tallying are:

* **Off-chain tallying** - there is no on-chain tallying and instead the result is determined off-chain by analysing all of the voting transactions
* **Global storage** - a tally is stored and incremented in global storage
* **Box storage** - a tally is stored and incremented in box storage

To determine a result there are numerous voting algorithms including first past the post and preferential voting. Assuming a preference for an on-chain voting algorithm, the complexity of storing preferences and then calculating a preference-based result is too complex (at least as a starting point), so the voting tool will use first past the post voting. One of the disadvantages of first pass the post voting is it's possible to "win" the vote with a reasonably low number of the overall vote proportion (particularly as the number of voting options increases). Given there is no on-chain action currently being proposed, the risk of such a circumstance is low and it can be left as a manual exercise to determine if the result of the vote was unsatisfactory and a new vote should be cast with different options.

### Option T1 - Off-chain tallying

**Pros**

- Smart contract code is significantly simpler
- Full flexibility to interpret results using more complex algorithms

**Cons**

- No verifiably authentic tamperproof record of the result of the voting round

### Option T2 - Global storage

**Pros**

- dApp logic is simpler (no need to load boxes)
- Possible to have a verifiably authentic tamperproof record of the result

**Cons**

- The number of questions and/or options that can be tracked is limited by the limits of global storage
- A single call to algod retrieves the list of created apps and their current global storage so it's easy to retrieve the data

### Option T3 - Box storage

**Pros**

- Much larger number of questions and/or options can be accomodated
- Possible to have a verifiably authentic tamperproof record of the result

**Cons**

- dApp logic is more complex (need to load boxes)
- Retrieving data from algod is harder (N+1 requests for N boxes, rather than 1 call to get all global storage values)

### Preferred option

Option T2 - Global storage.

Having the ability to have a verifiably authentic tamperproof record of the result is a really powerful feature that aligns well to the stated principles. The global storage option allows for a lot of simplicity in how that is handled and retrieved.

### Selected option

Option T3 - Box storage.

Given the goal is to have something that is flexible for future requirements using box storage yields a lot more flexibility in the number of questions / options that can be catered for. There is a downside in how easy the data is to retrieve though so it's possible this decision may be revisited.

## Capability: Recording the result

In order to allow the result of the voting round to be stored and inspected it needs to be recorded.

The options for this are:

* **Manual Non-Fungible Token (NFT)** - The result is emitted as an NFT by the account that created the voting smart contract in the first place
* **In-contract storage** - The result is kept in tallied in-contract storage (assuming the tallying option stores data on-chain; see [Capability: Tallying and result determination](#capability-tallying-and-result-determination))
* **Automated NFT** - The result is emitted as an NFT with on-chain metadata from within the voting smart contract at vote closure

### Option R1 - Manual NFT

**Pros**

- Ability to use any NFT standard including ones with immutable off-chain storage (e.g. IPFS)
- Simpler smart contract logic
- All NFTs are created from the same account so are easier to retrieve and visualise as a collection using standard ecosystem tools

**Cons**

- The NFT isn't guaranteed to be tamperproof, while someone can verify that the on-chain data matches the NFT metadata, you can't tell it from just seeing the NFT

### Option R2 - In-contract storage

**Pros**

- Simpler smart contract logic
- dApp logic is more complex (result must be visualised by loading data from the contract) and it's harder for people to quickly validate / see the result without the dApp

**Cons**

- Means the smart contract must be kept in-tact and not deleted, locking up any ALGOs to cover minimum balance requirement for that data forever

### Option R3 - Automated NFT

**Pros**

- Simple dApp logic
- Smart contract can be deleted to free up ALGOs
- Creates an easy to consume tamperproof, verifiably authentic record of the result

**Cons**

- Most complex smart contract logic
- NFT metadata standard limited to ones with on-chain storage such as ARC-69
- NFT is from different creator accounts so it's hard to load them all into a single collection

### Preferred option

Option R3 - Automated NFT.

The most elegant solution that conforms to the Integrity and transparency and Decentralised principles.

### Selected option

Option R3 - Automated NFT.

## Capability: Finding results

In order to find all of the results they need to be queried from the blockchain. The type of query that can be given depends on the selection for the [Recording the result](#capability-recording-the-result) and [Tallying and result determination](#capability-tallying-and-result-determination) capabilities.

Given a selection of:

* Option T3 - Box storage.
* Option R3 - Automated NFT.

If there is no cache then the following requests would be required:

* One call to algod to return all apps created by the creator wallet (including global state)
* Per each app:
    * One call to algod **per box** to get current box storage values (to see current voting state)
    * One call to indexer to get any transactions from the current user's account to that app (to see if/what the current user voted) (cacheable once voted, assuming voting is immutable)
    * One call to algod to get any assets created by the app account (to see if there is a result NFT)
      * One call to indexer to get creation transaction note for result NFT if there is one
    * One call to IPFS to get the voting round metadata (cacheable)
    * One call to IPFS to get the vote gating and weighting metadata (cacheable)

That's a lot of requests per app, including IPFS calls which can be very slow and unreliable depending on the gateway (although can be cached forever if the value doesn't change). This can result in a poor user experience with a lot of waiting.

The following options exist:

* **dApp querying** - Make the dApp query for all data directly (caching applied in-browser)
* **Cache API** - Have an API that caches the data and returns it all in a condensed format for the dApp to display
* **Collection cache records** - Automatically create cache records on-chain for the dApp to query directly and reduce the number of calls required, e.g. similar concept to [ARC-30](https://github.com/algorandfoundation/ARCs/pull/122), but including: apps (index and address), metadata IPFS hashes and result NFT asset indexes (and metadata to further improve the cache given this metadata is immutable)
   * This can be orchestrated by the voting round creator experience within the dApp and use their wallet to do it to reduce the complexity of maintenance since voting round creator actions would always generate a situation where the cache record would need to change

Regardless of which option is selected, it makes sense to use a write-through IPFS cache gateway so all IPFS calls are faster and more reliable.

### Option FR1 - dApp querying

**Pros**

- Most decentralised - no need to run any services to cache data and talking directly to indexer so no need to trust a different set of data

**Cons**

- Less optimal user experience (high time to wait, more HTTP calls so higher likelihood of API having errors and timeouts)
- Most complex dApp code

### Option FR2 - Cache API

**Pros**

- Best user experience - a single (or small number of), cached API can be called to retrieve the key data that a dApp needs to see
- dApp code is simple

**Cons**

- dApp isn't as portable, since it requires a specific server-side API to be running (there's potentially a middle ground though where the server can mimic some of the underlying services like IPFS, but with better response time and reliability due to caching)
- Cache API needs to be created (additional backend complexity beyond a write-through cache IPFS gateway)

### Option FR3 - Collection cache records

**Pros**

- Number of overall calls from the dApp is reduced, improving user experience
- (Assuming use of ARC-19) has nice cache semantics for the collection cache, since there is a simple algod lookup for the current reserve address of the collection cache asset and then a cacheable IPFS call
- Doesn't require a backend cache service to be built since it can be orchestrated by the voting round creator dApp, so retains a lot of portability
- Incidentally creates another abstraction that may provide useful future flexibility for a voting round creator to have separate "collections" of voting rounds for the same account (since data is tied to the collection cache record rather than the creator account)

**Cons**

- Introduces another synchronous upfront call to get to the data whenever it changes (i.e. algod call + (cacheable) IPFS call, assuming use of ARC-19)
- The dApp blindly trusts the data in this cache record is correct, but all data within it can be verified as accurate by looking at the raw on-chain records
- dApp logic for voting round creator is more complex (since the collection cache record needs to be maintained)
- If multiple people operated the voting round creator account and wanted to "publish" a voting round simultaneously it's possible they will overwrite the other round (but this is incredibly unlikely as anyone operating such an account would likely be communicating with each other, and also can be worked around in the future if needed by the voting round creator dApp detecting if a voting round hasn't been "published" and offer to do it)

### Preferred option

Option FR3 - Collection cache records.

A good balance between terrible user experience and centralisation / lack of portability.

### Selected option

Option FR3 - Collection cache records.


## Capability: Multiple questions

Having the flexibility to allow multiple questions to be asked as part of a voting round is an important requirement. The NFT Council voting will have multiple questions (one per category being nominated) and the xGov initiative will have multiple proposals to vote on (each considered a separate question).

There are a number of ways to achieve this:

* **Frontend linking** - A smart contract is created for each question and a voting round ID is set on them that the dApp can use to link them together visually
* **Transaction linking** - A smart contract is created for each question, but they must be voted on together in a single atomic transaction
* **Single contract, one vote** - A smart contract is created for the whole voting round and is built to handle multiple questions in a single vote
* **Single contract, multiple votes** - A smart contract is created for the whole voting round and is built to handle one question per vote (i.e. it's called multiple times to vote on different questions)

Enforcing required questions.

### Option MQ1 - Frontend linking

**Pros**

- By far the simplest to implement, for both the dApp and the smart contract
- No limit to the number of questions in a voting round

**Cons**

- No ability to enforce required questions or split a vote weight across questions
- Multiple transactions to sign for vote caster

### Option MQ2 - Transaction linking

**Pros**

- Question and answer handling is kept simple for dApp and smart contract
- Ability to enforce required questions (e.g. using a voting round contract that checks the integrity of each of the votes in the transaction group)

**Cons**

- Limit to the number of questions that can be asked based on the atomic group max size
- Extra contract or logic required to validate transaction group, which needs to somehow validate the app calls (presumably using a combination of a voting round ID combined with checking each app creator account matches); adding vote weight splitting to this logic too is likely to be extremely complex
- Multiple transactions to sign for vote caster

### Option MQ3 - Single contract, one vote

**Pros**

- User experience is the best - a single transaction call
- More easily possible to implement vote weight splitting and required/optional question validation

**Cons**

- Rather than building simple, composable, flexible components, this builds a more complex smart contract, which means it's more likely to have errors and will potentially be less flexible for future requirements the community has
- Question/answer handling logic will be complex in both the dApp and smart contract
- Number of questions will be limited by app argument semantics and storage limits

### Option MQ4 - Single contract, multiple votes

**Pros**

- Question and answer handling is kept simple for dApp and smart contract
- No limit to the number of questions in a voting round

**Cons**

- No ability to enforce required questions or split a vote weight across questions
- Multiple transactions to sign for vote caster
- Preventing double voting requires storing a bit flag per question (i.e. more boxes get used and the dApp needs to load the right box per question)

### Preferred option

Option MQ1 - Frontend linking.

Starting with this option leads to the simplest solution that meets current need (no need for current requirements to implement vote weight splitting or required questions), but provides the easiest base of functionality to be extended in the future to meet other requirements.

### Selected option

Option MQ1 - Frontend linking.



## Capability: Seeing individual responses

indexer
local storage cache, but MBR and extra transaction and can wipe it away

## Capability: Voting round to smart contract relationship


