/* eslint-disable no-case-declarations */
import * as algokit from '@algorandfoundation/algokit-utils'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/appspec'
import * as ed from '@noble/ed25519'
import algosdk from 'algosdk'

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

      const quorum = 1
      const questionOptions = [3, 4, 2]
      const totalQuestionOptions = questionOptions.reduce((a, b) => a + b, 0)
      const createArgs = [
        'vote_id',
        publicKey,
        'ipfs_cid',
        currentTime,
        currentTime + 50000,
        questionOptions,
        quorum,
        'ipfs://ipfs_cid2',
      ]
      const app =
        process.env.REDEPLOY_APP !== 'true'
          ? await appClient.create({
              method: 'create',
              methodArgs: createArgs,
              deletable: false,
            })
          : await appClient.deploy({
              allowDelete: isLocal,
              onSchemaBreak: isLocal ? 'replace' : 'fail',
              onUpdate: isLocal ? 'replace' : 'fail',
              createArgs: {
                method: 'create',
                methodArgs: createArgs,
              },
            })

      // Check if it's already been bootstrapped
      const appInfo = await algokit.getAppByIndex(app.appId, algod)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const isBootstrappedValue = appInfo.params['global-state']!.find(
        (s) => s.key === Buffer.from('is_bootstrapped').toString('base64'),
      )!.value
      const isBootstrapped = isBootstrappedValue.type == 2 && isBootstrappedValue.uint === 1

      // Bootstrap it if it hasn't
      if (!isBootstrapped) {
        await appClient.call({
          method: 'bootstrap',
          methodArgs: {
            args: [
              appClient.fundAppAccount({
                amount: algokit.microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
                sendParams: { skipSending: true },
              }),
            ],
            boxes: ['V'],
          },
        })
      }

      // Create random voter
      const voter = algosdk.generateAccount()
      await algokit.transferAlgos(
        {
          amount: algokit.microAlgos(200_000),
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
        methodArgs: { args: [signature], boxes: [voter] },
        sendParams: { fee: algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000) },
        sender: voter,
      })
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
      const [isVotingOpen, isAllowedToVote, hasAlreadyVoted, time] = result.return!.returnValue! as any[]
      console.log({ isVotingOpen, isAllowedToVote, hasAlreadyVoted, time })

      // Show boxes before voting
      const getRawTally = async () => {
        return (
          await appClient.getBoxValuesAsABIType(
            new algosdk.ABIArrayStaticType(new algosdk.ABIUintType(64), totalQuestionOptions),
            (bn) => bn.name == 'V',
          )
        )[0].value
      }
      console.log(await getRawTally())

      // Cast vote
      await appClient.call({
        method: 'vote',
        methodArgs: {
          args: [
            appClient.fundAppAccount({
              amount: algokit.microAlgos(400 * /* key size */ (32 + /* value size */ totalQuestionOptions * 1) + 2500),
              sender: voter,
              sendParams: { skipSending: true },
            }),
            signature,
            questionOptions.map((x) => x - 1), // vote for the last option in each,
          ],
          boxes: ['V', voter],
        },
        sendParams: { fee: algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000) },
        sender: voter,
      })
      console.log('Voted successfully!')

      // Show boxes after voting
      console.log(await getRawTally())

      // Close vote
      await appClient.call({
        method: 'close',
        methodArgs: {
          args: [],
          boxes: ['V'],
        },
        sendParams: { fee: algokit.microAlgos(1_000 + 1_000) },
      })
      console.log('Voting round closed')

      const globalState = await appClient.getGlobalState()
      console.log(globalState)
      break
    default:
      throw new Error(`Attempt to deploy unknown contract ${name}`)
  }
}
