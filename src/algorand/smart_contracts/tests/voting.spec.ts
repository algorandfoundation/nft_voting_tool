import { test, describe, beforeEach, beforeAll } from '@jest/globals'
import * as algokit from '@algorandfoundation/algokit-utils'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import fs from 'fs/promises'
import path from 'path'
import { Algodv2, Account } from 'algosdk'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/appspec'
import * as ed from '@noble/ed25519'
import * as uuid from 'uuid'
import invariant from 'tiny-invariant'
import { encodeAnswerIdBoxRefs, encodeAnswerIds } from '../question-encoding'
import { ABIUintType } from 'algosdk'
import algosdk from 'algosdk'

describe('voting', () => {
  const localnet = algorandFixture()
  beforeEach(localnet.beforeEach, 10_000)

  let appSpec: AppSpec
  beforeAll(async () => {
    const appSpecPath = path.join(__dirname, '..', 'artifacts', 'VotingRoundApp', 'application.json')
    const appSpecBuffer = await fs.readFile(appSpecPath)
    appSpec = JSON.parse(appSpecBuffer.toString('utf-8')) as AppSpec
  })

  const setupApp = async (setup?: {
    cid?: string
    start?: number
    end?: number
    quorum?: number
    questionIds?: string[]
  }) => {
    let { cid, start, end, quorum, questionIds } = setup ?? {}
    const { algod, testAccount } = localnet.context

    const status = await algod.status().do()
    const lastRound = Number(status['last-round'])
    const round = await algod.block(lastRound).do()
    const currentTime = Number(round.block.ts)

    const privateKey = Buffer.from(ed.utils.randomPrivateKey())
    const publicKey = await ed.getPublicKey(privateKey)

    cid = cid ?? 'CID'
    start = start ?? currentTime
    end = end ?? currentTime + 100
    quorum = quorum ?? Math.ceil(Math.random() * 1000)
    questionIds = questionIds ?? [uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4()]
    const questions = {
      unencoded: questionIds,
      encoded: encodeAnswerIds(questionIds),
      boxRefs: encodeAnswerIdBoxRefs(questionIds),
    }

    const appClient = algokit.getApplicationClient(
      {
        app: appSpec,
        id: 0,
        sender: testAccount,
      },
      algod,
    )

    const app = await appClient.create({
      method: 'create',
      methodArgs: [publicKey, cid, start, end, quorum],
      deletable: false,
    })

    const bootstrap = async () => {
      const payTxn = (
        await algokit.transferAlgos(
          {
            from: testAccount,
            to: app.appAddress,
            amount: algokit.microAlgos(
              100_000 + questions.unencoded.length * (400 * /* key size */ (18 + /* value size */ 8) + 2500),
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
            signer: testAccount,
          },
          algod,
        )
      } catch (e) {
        throw appClient.exposeLogicError(e as Error)
      }
    }

    const getVoter = async () => {
      const voter = algosdk.generateAccount()
      await algokit.transferAlgos(
        {
          amount: algokit.algos(2),
          from: testAccount,
          to: voter.addr,
        },
        algod,
      )
      const decoded = algosdk.decodeAddress(voter.addr)
      const signature = await ed.sign(decoded.publicKey, privateKey)
      return {
        account: voter,
        signature,
      }
    }

    return {
      algod,
      testAccount,
      appClient,
      publicKey,
      privateKey,
      currentTime,
      cid,
      start,
      end,
      quorum,
      app,
      questions,
      bootstrap,
      getVoter,
      voteFee: algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000),
    }
  }

  test('create', async () => {
    const { appClient, publicKey, cid, start, end, quorum } = await setupApp()

    const globalState = await appClient.getGlobalState()
    invariant('valueRaw' in globalState.snapshot_public_key)
    expect(globalState.snapshot_public_key.valueRaw).toEqual(publicKey)

    expect(globalState.metadata_ipfs_cid.value).toBe(cid)
    expect(globalState.start_time.value).toBe(start)
    expect(globalState.end_time.value).toBe(end)
    expect(globalState.quorum.value).toBe(quorum)
    expect(globalState.is_bootstrapped.value).toBe(0)

    const boxes = await appClient.getBoxNames()
    expect(boxes.length).toBe(0)
  })

  test('bootstrap', async () => {
    const { appClient, bootstrap, questions } = await setupApp()

    await bootstrap()

    const globalState = await appClient.getGlobalState()
    expect(globalState.is_bootstrapped.value).toBe(1)

    const boxes = await appClient.getBoxNames()
    expect(boxes.map((b) => b.nameBase64).sort()).toEqual(
      questions.boxRefs.map((b) => Buffer.from(b.name).toString('base64')).sort(),
    )

    const boxValues = await appClient.getBoxValuesAsABIType(new ABIUintType(64))
    expect(boxValues.map((v) => v.value)).toEqual([0n, 0n, 0n, 0n])
  })

  test('get_preconditions', async () => {
    const { appClient, getVoter, voteFee, currentTime, start, end } = await setupApp()
    const voter = await getVoter()

    const result = await appClient.call({
      method: 'get_preconditions',
      methodArgs: {
        args: [voter.signature],
      },
      sendParams: { fee: voteFee },
      sender: voter.account,
    })

    const [isVotingOpen, isAllowedToVote, hasAlreadyVoted, time] = result.return!.returnValue! as any[]
    expect(Number(isVotingOpen)).toBe(1)
    expect(Number(isAllowedToVote)).toBe(1)
    expect(Number(hasAlreadyVoted)).toBe(0)
    expect(Number(time)).toBeGreaterThan(currentTime)
  })

  test('successful vote', async () => {
    const { appClient, questions, getVoter, voteFee } = await setupApp()
    const voter = await getVoter()

    await appClient.call({
      method: 'vote',
      methodArgs: {
        args: [voter.signature, questions.encoded[0]],
        boxes: [questions.boxRefs[0]],
      },
      sendParams: { fee: voteFee },
      sender: voter.account,
    })

    const boxValue = await appClient.getBoxValuesAsABIType(
      new ABIUintType(64),
      (b) => b.name === questions.boxRefs[0].name,
    )
    expect(boxValue[0].value).toBe(1n)
    const otherBoxValues = await appClient.getBoxValuesAsABIType(
      new ABIUintType(64),
      (b) => b.name !== questions.boxRefs[0].name,
    )
    expect(otherBoxValues.map((v) => v.value)).toEqual([0n, 0n, 0n])
  })
})
