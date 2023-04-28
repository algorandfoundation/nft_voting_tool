import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AppCompilationResult, AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { AppSourceMaps } from '@algorandfoundation/algokit-utils/types/app-client'
import algosdk, { ABIUintType } from 'algosdk'
import * as uuid from 'uuid'
import * as appSpec from '../../../algorand/smart_contracts/artifacts/VotingRoundApp/application.json'
import { VotingRoundPopulated } from './types'

export const algod = algokit.getAlgoClient({
  server: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
  port: import.meta.env.VITE_ALGOD_NODE_CONFIG_PORT,
  token: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN,
})

export const indexer = algokit.getAlgoIndexerClient({
  server: import.meta.env.VITE_INDEXER_SERVER,
  port: import.meta.env.VITE_INDEXER_PORT,
  token: import.meta.env.VITE_INDEXER_TOKEN,
})

export const fetchTallyCounts = async (appId: number, optionIds: string[]) => {
  const client = algokit.getApplicationClient(
    {
      app: JSON.stringify(appSpec),
      id: appId,
    },
    algod,
  )

  try {
    const box = await client.getBoxValue('V')
    const type = new algosdk.ABIArrayStaticType(new ABIUintType(64), optionIds.length)
    return (type.decode(box) as number[]).map((count, index) => ({
      optionId: optionIds[index],
      count: Number(count),
    }))
  } catch {
    return (await client.getBoxValuesFromABIType(new ABIUintType(64), (b) => b.name.startsWith('V_'))).map((box) => ({
      optionId: uuid.stringify(box.name.nameRaw, 2),
      count: Number(box.value),
    }))
  }
}

export const fetchVoterVotes = async (appId: number, voterAddress: string, round: VotingRoundPopulated) => {
  const client = algokit.getAppClient(
    {
      app: JSON.stringify(appSpec),
      id: appId,
    },
    algod,
  )

  try {
    const box = await client.getBoxValue(algosdk.decodeAddress(voterAddress).publicKey)

    const type = new algosdk.ABIArrayDynamicType(new algosdk.ABIUintType(8))
    return box
      ? round.hasVoteTallyBox
        ? type
            .decode(box)
            .map(Number)
            .map((optionIndex, questionIndex) => round.questions[questionIndex].options[optionIndex].id)
        : [uuid.stringify(box)]
      : undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.message?.includes('404')) {
      return undefined
    }
    throw e
  }
}

export const VotingRoundContract = (sender: TransactionSignerAccount) => {
  const create = async (
    voteId: string,
    publicKey: Uint8Array,
    cid: string,
    start: number,
    end: number,
    quorum: number,
    nftImageUrl: string,
    questionCounts: number[],
  ): Promise<AppReference & Partial<AppCompilationResult>> => {
    const appClient = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: 0,
        sender,
      },
      algod,
    )

    const app = await appClient.create({
      method: 'create',
      methodArgs: [voteId, publicKey, cid, start, end, questionCounts, quorum, nftImageUrl],
      deletable: false,
      sendParams: { fee: (1_000 + 1_000 * 4).microAlgos() },
    })

    return app
  }

  const bootstrap = async (app: AppReference, totalQuestionOptions: number) => {
    const appClient = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: app.appId,
        sender,
      },
      algod,
    )

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

  const castVote = async (signature: string, questionIndexes: number[], appId: number, sourceMaps: AppSourceMaps | undefined) => {
    const client = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: appId,
      },
      algod,
    )

    if (sourceMaps) {
      client.importSourceMaps(sourceMaps)
    }

    const signatureByteArray = Buffer.from(signature, 'base64')
    const voteFee = algokit.microAlgos(1_000 + 11 /* opup - 700 x 11 to get 7700 */ * 1_000)
    const transaction = await client.call({
      method: 'vote',
      methodArgs: {
        args: [
          client.fundAppAccount({
            amount: algokit.microAlgos(400 * /* key size */ (32 + /* value size */ 2 + questionIndexes.length * 1) + 2500),
            sender,
            sendParams: { skipSending: true },
          }),
          signatureByteArray,
          questionIndexes,
        ],
        boxes: ['V', sender],
      },
      sendParams: { fee: voteFee },
      sender,
    })

    return transaction
  }

  const closeVotingRound = async (appId: number) => {
    const client = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: appId,
      },
      algod,
    )
    return await client.call({
      method: 'close',
      methodArgs: {
        args: [],
        boxes: ['V'],
      },
      sendParams: { fee: algokit.microAlgos(1_000 + 29 /* opup - 700 x 30 to get 20000 */ * 1_000) },
      sender,
    })
  }

  return {
    create,
    bootstrap,
    castVote,
    fetchBoxes: fetchTallyCounts,
    closeVotingRound,
  }
}
