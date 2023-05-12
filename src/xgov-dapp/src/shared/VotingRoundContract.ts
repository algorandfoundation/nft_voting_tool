import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { ApplicationResponse, TealValue } from '@algorandfoundation/algokit-utils/types/algod'
import { AppCompilationResult, AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { AppSourceMaps } from '@algorandfoundation/algokit-utils/types/app-client'
import algosdk, { ABIUintType } from 'algosdk'
import * as uuid from 'uuid'
import * as appSpec from '../../../algorand/smart_contracts/artifacts/VotingRoundApp/application.json'
import { VotingRoundMetadata } from './IPFSGateway'

export type VotingRoundGlobalState = {
  appId: number
  start_time: string
  end_time: string
  quorum: number
  close_time: string | undefined
  metadata_ipfs_cid: string
  is_bootstrapped: boolean
  nft_image_url: string | undefined
  nft_asset_id: number | undefined
  voter_count: number
  total_options: number | undefined
  option_counts: number[] | undefined
}

export type TallyCounts = {
  optionId: string
  count: number
}[]

export const algod = algokit.getAlgoClient({
  server: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
  port: import.meta.env.VITE_ALGOD_NODE_CONFIG_PORT,
  token: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN,
})

const indexer = algokit.getAlgoIndexerClient({
  server: import.meta.env.VITE_INDEXER_SERVER,
  port: import.meta.env.VITE_INDEXER_PORT,
  token: import.meta.env.VITE_INDEXER_TOKEN,
})

export const fetchVotingRoundGlobalState = async (appId: number): Promise<VotingRoundGlobalState | undefined> => {
  if (import.meta.env.VITE_HIDDEN_VOTING_ROUND_IDS?.split(',')?.includes(appId.toString())) {
    return undefined
  }
  const app = await algod.getApplicationByID(appId).do()
  if (!app.params['global-state']) {
    return undefined
  }
  return decodeVotingRoundGlobalState(app.params['global-state'], appId)
}

export const fetchVotingRoundGlobalStatesByCreators = async (creatorAddresses: string[]): Promise<VotingRoundGlobalState[]> => {
  const globalStates = await Promise.all(creatorAddresses.map((address) => fetchVotingRoundGlobalStatesByCreator(address)))
  return globalStates.flat()
}

export const fetchVotingRoundGlobalStatesByCreator = async (creatorAddress: string): Promise<VotingRoundGlobalState[]> => {
  const applicationsByCreator = await indexer.lookupAccountCreatedApplications(creatorAddress).do()
  const globalStates = applicationsByCreator.applications.map((app: ApplicationResponse) => {
    if (!app.params['global-state'] || import.meta.env.VITE_HIDDEN_VOTING_ROUND_IDS?.split(',')?.includes(app.id.toString())) {
      return undefined
    }
    return decodeVotingRoundGlobalState(app.params['global-state'], app.id)
  })
  return globalStates.filter(Boolean)
}

export const fetchTallyCounts = async (appId: number, roundMetadata: VotingRoundMetadata): Promise<TallyCounts> => {
  const optionIds = roundMetadata.questions.flatMap((q) => q.options.map((o) => o.id))
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

export const fetchVoterVotes = async (
  appId: number,
  voterAddress: string | undefined,
  roundMetadata: VotingRoundMetadata | undefined,
  globalState: VotingRoundGlobalState | undefined,
) => {
  const client = algokit.getAppClient(
    {
      app: JSON.stringify(appSpec),
      id: appId,
    },
    algod,
  )

  if (!voterAddress || !roundMetadata || !globalState) {
    return undefined
  }

  try {
    const box = await client.getBoxValue(algosdk.decodeAddress(voterAddress).publicKey)

    const type = new algosdk.ABIArrayDynamicType(new algosdk.ABIUintType(8))
    return box
      ? globalState.total_options !== undefined
        ? type
            .decode(box)
            .map(Number)
            .map((optionIndex, questionIndex) => roundMetadata.questions[questionIndex].options[optionIndex].id)
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

export const create = async (
  sender: TransactionSignerAccount,
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

export const bootstrap = async (sender: TransactionSignerAccount, app: AppReference, totalQuestionOptions: number) => {
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
          amount: algokit.microAlgos(200_000 + 100_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
          sendParams: { skipSending: true, fee: (2_000).microAlgos() },
        }),
      ],
      boxes: ['V'],
    },
  })
}

export const castVote = async (
  sender: TransactionSignerAccount,
  signature: string,
  questionIndexes: number[],
  appId: number,
  sourceMaps: AppSourceMaps | undefined,
) => {
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

export const closeVotingRound = async (sender: TransactionSignerAccount, appId: number) => {
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

export const decodeVotingRoundGlobalState = (
  globalState: {
    key: string
    value: TealValue
  }[],
  appId: number,
): VotingRoundGlobalState => {
  const decodedState = {
    appId: appId,
    start_time: '0',
    end_time: '0',
    quorum: 0,
    close_time: undefined,
    metadata_ipfs_cid: '',
    is_bootstrapped: false,
    nft_image_url: undefined,
    nft_asset_id: undefined,
    voter_count: 0,
    total_options: undefined,
    option_counts: undefined,
  } as VotingRoundGlobalState
  globalState.map((state) => {
    const globalKey = Buffer.from(state.key, 'base64').toString()
    const optionCountsType = new algosdk.ABIArrayDynamicType(new algosdk.ABIUintType(8))
    if (state.value.type === 2) {
      switch (globalKey) {
        case 'start_time':
          decodedState.start_time = new Date(Number(state.value.uint) * 1000).toISOString()
          break
        case 'end_time':
          decodedState.end_time = new Date(Number(state.value.uint) * 1000).toISOString()
          break
        case 'is_bootstrapped':
          decodedState.is_bootstrapped = !!state.value.uint
          break
        case 'close_time':
          decodedState.close_time = state.value.uint > 0 ? new Date(Number(state.value.uint) * 1000).toISOString() : undefined
          break
        case 'nft_asset_id':
          decodedState.nft_asset_id = state.value.uint > 0 ? Number(state.value.uint) : undefined
          break
        case 'voter_count':
          decodedState.voter_count = Number(state.value.uint)
          break
        case 'total_options':
          decodedState.total_options = Number(state.value.uint)
          break
      }
    } else {
      switch (globalKey) {
        case 'metadata_ipfs_cid':
          decodedState.metadata_ipfs_cid = Buffer.from(state.value.bytes, 'base64').toString('utf-8')
          break
        case 'nft_image_url':
          decodedState.nft_image_url = Buffer.from(state.value.bytes, 'base64').toString('utf-8')
          break
        case 'option_counts':
          decodedState.option_counts = optionCountsType.decode(Buffer.from(state.value.bytes, 'base64')).map(Number)
      }
    }
  })
  return decodedState
}
