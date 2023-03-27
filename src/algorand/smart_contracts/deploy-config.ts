import * as algokit from '@algorandfoundation/algokit-utils'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/appspec'
import * as ed from '@noble/ed25519'
import algosdk from 'algosdk'
import * as uuid from 'uuid'
import { encodeAnswerId, encodeAnswerIdBoxRef, encodeAnswerIdBoxRefs, encodeAnswerIds } from './question-encoding'

// Edit this to add in your contracts
export const contracts = ['VotingRoundApp'] as const

export async function deploy(name: (typeof contracts)[number], appSpec: AppSpec) {
  const algod = algokit.getAlgoClient()
  const indexer = algokit.getAlgoIndexerClient()
  const deployer = await algokit.getAccount('DEPLOYER', algod)
  await algokit.ensureFunded(
    {
      accountToFund: deployer,
      fundingSource: await algokit.getDispenserAccount(algod),
      minSpendingBalance: algokit.algos(10),
      minFundingIncrement: algokit.algos(10),
    },
    algod,
  )
  const isLocal = await algokit.isLocalNet(algod)
  const appClient = algokit.getApplicationClient(
    {
      app: appSpec,
      sender: deployer,
      creatorAddress: deployer.addr,
      indexer,
    },
    algod,
  )

  switch (name) {
    // Edit this to add the custom deployment logic for each contract
    case 'VotingRoundApp':
      if (!isLocal) {
        throw new Error(`This deployment handler is only for a local development feedback loop.`)
      }

      //const privateKey = Buffer.from(ed.utils.randomPrivateKey()).toString('base64')
      //console.log(privateKey)
      // Hard-code the private key so it works across subsequent runs
      const privateKey = Buffer.from('ja126KrhZHWYfH/hv5Y6y52QQUyPfU7sFLsm0ywtRMI=', 'base64')
      const publicKey = await ed.getPublicKey(privateKey)

      // Get current timestamp (LocalNet time is unknown)
      const status = await algod.status().do()
      const lastRound = Number(status['last-round'])
      const round = await algod.block(lastRound).do()
      const currentTime = Number(round.block.ts)

      // Idempotently deploy (create/update/replace) the app
      const app = await appClient.deploy({
        allowDelete: isLocal,
        onSchemaBreak: isLocal ? 'replace' : 'fail',
        onUpdate: isLocal ? 'replace' : 'fail',
        createArgs: {
          method: 'create',
          methodArgs: [publicKey, 'a', currentTime, currentTime + 50000, 1],
        },
      })
      const appRef = await appClient.getAppReference()

      // Check if it's already been bootstrapped
      const appInfo = await algokit.getAppByIndex(app.appId, algod)
      const isBootstrappedValue = appInfo.params['global-state']!.find(
        (s) => s.key === Buffer.from('is_bootstrapped').toString('base64'),
      )!.value
      const isBootstrapped = isBootstrappedValue.type == 2 && isBootstrappedValue.uint === 1

      // Bootstrap it if it hasn't
      if (!isBootstrapped) {
        const questionIds = ['a', uuid.v4()]
        const payTxn = (
          await algokit.transferAlgos(
            {
              from: deployer,
              to: appRef.appAddress,
              amount: algokit.microAlgos(
                100_000 + questionIds.length * (400 * /* key size */ (18 + /* value size */ 8) + 2500),
              ),
              skipSending: true,
            },
            algod,
          )
        ).transaction
        const callTxn = (
          await appClient.call({
            method: 'bootstrap',
            methodArgs: {
              args: [/*payTxn, */ encodeAnswerIds(questionIds)],
              boxes: encodeAnswerIdBoxRefs(questionIds),
            },
            sendParams: { skipSending: true },
          })
        ).transaction
        try {
          await algokit.sendGroupOfTransactions(
            {
              transactions: [payTxn, callTxn],
              signer: deployer,
            },
            algod,
          )
        } catch (e) {
          throw appClient.exposeLogicError(e)
        }
      }

      // Create random voter
      const voter = algosdk.generateAccount()
      await algokit.transferAlgos(
        {
          amount: algokit.microAlgos(100_000 + 4_000 * 2),
          from: deployer,
          to: voter.addr,
        },
        algod,
      )
      const decoded = algosdk.decodeAddress(voter.addr)
      const signature = await ed.sign(decoded.publicKey, privateKey)

      // Call get_preconditions to check it works
      const result = await appClient.call({
        method: 'get_preconditions',
        methodArgs: [signature],
        sendParams: { fee: algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000) },
        sender: voter,
      })
      const [isVotingOpen, isAllowedToVote, hasAlreadyVoted, time] = result.return!.returnValue! as any[]
      console.log({ isVotingOpen, isAllowedToVote, hasAlreadyVoted, time })

      // Show boxes before voting
      const boxes = await appClient.getBoxValuesAsABIType(new algosdk.ABIUintType(64))
      console.log(boxes)

      // Cast vote
      await appClient.call({
        method: 'vote',
        methodArgs: {
          args: [signature, encodeAnswerId('a')],
          boxes: [encodeAnswerIdBoxRef('a')],
        },
        sendParams: { fee: algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000) },
        sender: voter,
      })
      console.log('Voted successfully!')

      // Show boxes after voting
      const boxes2 = await appClient.getBoxValuesAsABIType(new algosdk.ABIUintType(64))
      console.log(boxes2)

      break
    default:
      throw new Error(`Attempt to deploy unknown contract ${name}`)
  }
}
