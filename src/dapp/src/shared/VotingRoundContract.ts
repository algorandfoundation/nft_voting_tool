import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import algosdk, { ABIUintType } from 'algosdk'
import * as uuid from 'uuid'
import * as appSpec from '../../../algorand/smart_contracts/artifacts/VotingRoundApp/application.json'
import { encodeAnswerId, encodeAnswerIdBoxRef, encodeAnswerIdBoxRefs, encodeAnswerIds } from './question-encoding'

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

export const fetchTallyBoxes = async (appId: number) => {
  const client = algokit.getApplicationClient(
    {
      app: JSON.stringify(appSpec),
      id: appId,
    },
    algod,
  )

  return await client.getBoxValuesAsABIType(new ABIUintType(64), (b) => b.name.startsWith('V_'))
}

export const fetchVoteBox = async (appId: number, voterAddress: string) => {
  const client = algokit.getApplicationClient(
    {
      app: JSON.stringify(appSpec),
      id: appId,
    },
    algod,
  )

  const box = (
    await client.getBoxValues((b) => b.nameBase64 === Buffer.from(algosdk.decodeAddress(voterAddress).publicKey).toString('base64'))
  )[0]
  return box ? uuid.stringify(box.value) : undefined
}

export const VotingRoundContract = (sender: TransactionSignerAccount) => {
  const create = async (publicKey: Uint8Array, cid: string, start: number, end: number, quorum: number): Promise<AppReference> => {
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
      methodArgs: [publicKey, cid, start, end, quorum],
      deletable: false,
    })
    return app
  }

  const bootstrap = async (app: AppReference, optionIds: string[]) => {
    const appClient = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: app.appId,
        sender,
      },
      algod,
    )

    const option = {
      unencoded: optionIds,
      encoded: encodeAnswerIds(optionIds),
      boxRefs: encodeAnswerIdBoxRefs(optionIds, app),
    }

    await appClient.call({
      method: 'bootstrap',
      methodArgs: {
        args: [
          appClient.fundAppAccount(
            algokit.microAlgos(100_000 + optionIds.length * (400 * /* key size */ (18 + /* value size */ 8) + 2500)),
          ),
          option.encoded,
        ],
        boxes: option.boxRefs,
      },
    })
  }

  const castVote = async (signature: string, selectedOption: string, appId: number) => {
    const client = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: appId,
      },
      algod,
    )

    const signatureByteArray = Buffer.from(signature, 'base64')
    const voteFee = algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000)
    const transaction = await client.call({
      method: 'vote',
      methodArgs: {
        args: [
          client.fundAppAccount({
            amount: algokit.microAlgos(400 * /* key size */ (32 + /* value size */ 16) + 2500),
            sender,
          }),
          signatureByteArray,
          encodeAnswerId(selectedOption),
        ],
        boxes: [encodeAnswerIdBoxRef(selectedOption), sender],
      },
      sender,
      sendParams: { fee: voteFee },
    })

    return transaction
  }

  const closeVotingRound = async (_appId: number) => {
    //TODO: Implement closing the voting round smart contract call
  }

  return {
    create,
    bootstrap,
    castVote,
    fetchBoxes: fetchTallyBoxes,
    closeVotingRound,
  }
}
