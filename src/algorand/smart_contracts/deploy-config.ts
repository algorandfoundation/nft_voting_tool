import * as algokit from '@algorandfoundation/algokit-utils'
import { AppReference, BoxReference } from '@algorandfoundation/algokit-utils/types/app'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/appspec'
import * as ed from '@noble/ed25519'
import algosdk from 'algosdk'
import * as uuid from 'uuid'

// Edit this to add in your contracts
export const contracts = ['VotingRoundApp'] as const

function encodeAnswerIds(ids: string[]): Uint8Array[] {
  return ids.map((id) => {
    if (uuid.validate(id)) {
      return uuid.parse(id)
    }

    if (id.length > 16) {
      throw new Error(`Answer IDs must either be a GUID or a string <= 16 bytes, but received: ${id}`)
    }

    return Buffer.from(id.padEnd(16, '\0'))
  })
}

function encodeAnswerIdBoxRefs(ids: string[], ref?: AppReference): BoxReference[] {
  const prefix = Buffer.from('V_')

  return encodeAnswerIds(ids).map((encodedId) => {
    const buffer = new Uint8Array(16 + 'V_'.length)
    buffer.set(prefix, 0)
    buffer.set(encodedId, prefix.length)
    return {
      appId: ref?.appId ?? 0,
      name: buffer,
    }
  })
}

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
          method: 'create',
          methodArgs: [publicKey, 'a', currentTime, currentTime + 5000, 1],
        },
      })
      const appRef = await appClient.getAppReference()

      const questionIds = [uuid.v4()]
      const payTxn = (
        await algokit.transferAlgos(
          {
            from: deployer,
            to: appRef.appAddress,
            amount: algokit.microAlgos(
              100_000 + 400 * /* key size */ (18 + /* value size */ 8) * questionIds.length + 2500,
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

      // Generate some dummy data using the public key
      const decoded = algosdk.decodeAddress(deployer.addr)
      const signature = await ed.sign(decoded.publicKey, privateKey)

      // Call get_preconditions to check it works
      const result = await appClient.call({
        method: 'get_preconditions',
        methodArgs: [signature],
        sendParams: { fee: algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000) },
      })
      const [isVotingOpen, isAllowedToVote, hasAlreadyVoted, time] = result.return!.returnValue! as any[]
      console.log({ isVotingOpen, isAllowedToVote, hasAlreadyVoted, time })
      break
    default:
      throw new Error(`Attempt to deploy unknown contract ${name}`)
  }
}
