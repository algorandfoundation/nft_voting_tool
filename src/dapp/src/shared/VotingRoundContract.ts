import * as algokit from '@algorandfoundation/algokit-utils'
import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { TransactionSigner } from 'algosdk'
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

export const VotingRoundContract = (activeAddress: string, signer: TransactionSigner) => {
  const sender = {
    addr: activeAddress,
    signer: signer,
  }

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

  const bootstrap = async (app: AppReference, questionIds: string[]) => {
    const appClient = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: app.appId,
        sender,
      },
      algod,
    )

    const questions = {
      unencoded: questionIds,
      encoded: encodeAnswerIds(questionIds),
      boxRefs: encodeAnswerIdBoxRefs(questionIds),
    }

    const payTxn = (
      await algokit.transferAlgos(
        {
          from: sender,
          to: app.appAddress,
          amount: algokit.microAlgos(100_000 + questions.unencoded.length * (400 * /* key size */ (18 + /* value size */ 8) + 2500)),
          skipSending: true,
        },
        algod,
      )
    ).transaction
    const callTxn = (
      await appClient.call({
        method: 'bootstrap',
        methodArgs: {
          args: [/*payTxn, */ questions.encoded],
          boxes: questions.boxRefs,
        },
        sendParams: { skipSending: true },
      })
    ).transaction
    try {
      await algokit.sendGroupOfTransactions(
        {
          transactions: [payTxn, callTxn],
          signer: sender,
        },
        algod,
      )
    } catch (e) {
      throw appClient.exposeLogicError(e as Error)
    }
  }

  const castVote = async (signature: string, selectedOption: string, appId: number) => {
    const client = algokit.getApplicationClient(
      {
        app: JSON.stringify(appSpec),
        id: appId,
      },
      algod,
    )

    const signatureByArray = Buffer.from(signature, 'base64')
    const voteFee = algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000)

    const transaction = await client.call({
      method: 'vote',
      methodArgs: {
        args: [signatureByArray, encodeAnswerId(selectedOption)],
        boxes: [encodeAnswerIdBoxRef(selectedOption, await client.getAppReference())],
      },
      sender: {
        addr: activeAddress,
        signer: signer,
      },
      sendParams: { fee: voteFee },
    })

    return transaction
  }

  return {
    create,
    bootstrap,
    castVote,
  }
}
