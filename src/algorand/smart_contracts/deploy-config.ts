import * as algokit from '@algorandfoundation/algokit-utils'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/appspec'
import * as ed from '@noble/ed25519'
import algosdk from 'algosdk'

// Edit this to add in your contracts
export const contracts = ['VotingRoundApp'] as const

export async function deploy(name: (typeof contracts)[number], appSpec: AppSpec) {
  const algod = algokit.getAlgoClient()
  const indexer = algokit.getAlgoIndexerClient()
  const deployer = await algokit.getAccount({ name: 'DEPLOYER' }, algod)
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
        throw new Error(`This deployment handler is only for local development.`)
      }

      //const privateKey = Buffer.from(ed.utils.randomPrivateKey()).toString('base64')
      //console.log(privateKey)
      // Hard-code the private key so it works for subsequent runs
      const privateKey = Buffer.from('ja126KrhZHWYfH/hv5Y6y52QQUyPfU7sFLsm0ywtRMI=', 'base64')
      const publicKey = await ed.getPublicKey(privateKey)

      const status = await algod.status().do()
      const lastRound = Number(status['last-round'])
      const round = await algod.block(lastRound).do()
      const currentTime = Number(round.block.ts)

      const app = await appClient.deploy({
        version: '1.0',
        allowDelete: isLocal,
        onSchemaBreak: isLocal ? 'replace' : 'fail',
        onUpdate: isLocal ? 'replace' : 'fail',
        createArgs: {
          method: appClient.getABIMethod('create')!,
          args: [publicKey, 'a', currentTime, currentTime + 5000, 1],
        },
      })

      // Generate some dummy data using the public key
      const decoded = algosdk.decodeAddress(deployer.addr)
      const signature = await ed.sign(decoded.publicKey, privateKey)

      // Call get_preconditions to check it works
      const result = await appClient.call({
        method: 'get_preconditions',
        methodArgs: [signature],
        callType: 'normal',
        sendParams: { fee: algokit.microAlgos(3_000) },
      })
      const [isVotingOpen, isAllowedToVote, hasAlreadyVoted, time] = result.return!.returnValue! as any[]
      console.log({ isVotingOpen, isAllowedToVote, hasAlreadyVoted, time })
      break
    default:
      throw new Error(`Attempt to deploy unknown contract ${name}`)
  }
}
