/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, describe, beforeEach, beforeAll } from '@jest/globals'
import * as algokit from '@algorandfoundation/algokit-utils'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import fs from 'fs/promises'
import path from 'path'
import { Account } from 'algosdk'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/appspec'
import * as ed from '@noble/ed25519'
import * as uuid from 'uuid'
import invariant from 'tiny-invariant'
import { encodeAnswerId, encodeAnswerIdBoxRef, encodeAnswerIdBoxRefs, encodeAnswerIds } from '../question-encoding'
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
    voteId?: string
    cid?: string
    start?: number
    end?: number
    quorum?: number
    questionIds?: string[]
    nftImageUrl?: string
  }) => {
    let { voteId, cid, start, end, quorum, questionIds, nftImageUrl } = setup ?? {}
    const { algod, testAccount } = localnet.context

    const status = await algod.status().do()
    const lastRound = Number(status['last-round'])
    const round = await algod.block(lastRound).do()
    const currentTime = Number(round.block.ts)

    const voteFee = algokit.microAlgos(1_000 + 3 /* opup - 700 x 3 to get 2000 */ * 1_000)

    const privateKey = Buffer.from(ed.utils.randomPrivateKey())
    const publicKey = await ed.getPublicKey(privateKey)

    voteId = voteId ?? `V${new Date().getTime().toString(32).toUpperCase()}`
    cid = cid ?? 'CID'
    start = start ?? currentTime
    end = end ?? currentTime + 1000
    quorum = quorum ?? Math.ceil(Math.random() * 1000)
    questionIds = questionIds ?? [uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4()]
    nftImageUrl = nftImageUrl ?? 'ipfs://cid'
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
      methodArgs: [voteId, publicKey, cid, start, end, quorum, nftImageUrl],
      deletable: false,
    })

    const bootstrap = async () => {
      return await appClient.call({
        method: 'bootstrap',
        methodArgs: {
          args: [
            appClient.fundAppAccount({
              amount: algokit.microAlgos(
                200_000 + 1_000 + questions.unencoded.length * (400 * /* key size */ (18 + /* value size */ 8) + 2500),
              ),
              sendParams: { skipSending: true },
            }),
            questions.encoded,
          ],
          boxes: questions.boxRefs,
        },
      })
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

    const vote = async (voter: { account: Account; signature: Uint8Array }, questionIndex: number) => {
      return await appClient.call({
        method: 'vote',
        methodArgs: {
          args: [
            appClient.fundAppAccount({
              amount: algokit.microAlgos(400 * /* key size */ (32 + /* value size */ 16) + 2500),
              sender: voter.account,
              sendParams: { skipSending: true },
            }),
            voter.signature,
            questions.encoded[questionIndex],
          ],
          boxes: [questions.boxRefs[questionIndex], voter.account],
        },
        sendParams: { fee: voteFee },
        sender: voter.account,
      })
    }

    const close = async () => {
      return await appClient.call({
        method: 'close',
        methodArgs: [],
      })
    }

    return {
      algod,
      testAccount,
      appClient,
      voteId,
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
      voteFee,
      vote,
      close,
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

  test('double bootstrap', async () => {
    const { bootstrap } = await setupApp()
    await bootstrap()

    try {
      await bootstrap()
      invariant(false)
    } catch (e: any) {
      expect(e.stack).toMatchInlineSnapshot(`
        "assert
        bytec_3 // "is_bootstrapped"
        app_global_get
        !
        // Already bootstrapped
        assert <--- Error
        bytec_3 // "is_bootstrapped"
        intc_1 // 1
        app_global_put
        pushint 201000 // 201000"
      `)
    }
  })

  test('get_preconditions', async () => {
    const { appClient, getVoter, voteFee, currentTime, bootstrap } = await setupApp()
    await bootstrap()
    const voter = await getVoter()

    const result = await appClient.call({
      method: 'get_preconditions',
      methodArgs: {
        args: [voter.signature],
        boxes: [voter.account],
      },
      sendParams: { fee: voteFee },
      sender: voter.account,
    })

    const [isVotingOpen, isAllowedToVote, hasAlreadyVoted, time] = result.return!.returnValue! as any[]
    expect(Number(isVotingOpen)).toBe(1)
    expect(Number(isAllowedToVote)).toBe(1)
    expect(Number(hasAlreadyVoted)).toBe(0)
    expect(Number(time)).toBeGreaterThanOrEqual(currentTime)
  })

  describe('close', () => {
    test('successful', async () => {
      const { close, getVoter, vote, bootstrap, appClient, currentTime, quorum, voteId, cid } = await setupApp()
      await bootstrap()
      const voter = await getVoter()
      await vote(voter, 0)

      const result = await close()

      const globalState = await appClient.getGlobalState()
      invariant(result.confirmation)
      invariant(result.confirmation?.['inner-txns']?.[0])
      const inner = result.confirmation['inner-txns'][0]
      expect(inner['asset-index']).not.toBe(0)
      expect(inner['asset-index']).toBe(globalState.nft_asset_id.value)
      expect(globalState.close_time.value).toBeGreaterThanOrEqual(currentTime)
      const arc69Payload = JSON.parse(
        Buffer.from(inner.txn.txn.note ?? new Uint8Array())
          .toString('utf-8')
          .replace(new RegExp(voteId, 'g'), '{VOTE_ID}')
          .replace(new RegExp(quorum.toString(), 'g'), '"{QUORUM}"')
          .replace(new RegExp(cid, 'g'), '{CID}'),
      )
      expect(arc69Payload).toBeTruthy()
      expect(JSON.stringify(arc69Payload, undefined, 2)).toMatchInlineSnapshot(`
        "{
          "standard": "arc69",
          "description": "This is a voting result NFT for voting round with ID {VOTE_ID}.",
          "properties": {
            "metadata": "ipfs://{CID}",
            "id": "{VOTE_ID}",
            "quorum": "{QUORUM}",
            "voterCount": 1
          }
        }"
      `)
    })
  })

  describe('vote', () => {
    test('successful', async () => {
      const { appClient, questions, getVoter, vote, bootstrap } = await setupApp()
      await bootstrap()
      const voter = await getVoter()

      await vote(voter, 0)

      const boxValue = await appClient.getBoxValuesAsABIType(
        new ABIUintType(64),
        (b) => b.nameBase64 === Buffer.from(questions.boxRefs[0].name).toString('base64'),
      )
      expect(boxValue[0].value).toBe(1n)
      const otherBoxValues = await appClient.getBoxValuesAsABIType(
        new ABIUintType(64),
        (b) => b.name.startsWith('V_') && b.nameBase64 !== Buffer.from(questions.boxRefs[0].name).toString('base64'),
      )
      expect(otherBoxValues.map((v) => v.value)).toEqual([0n, 0n, 0n])
    })

    test('double voting', async () => {
      const { getVoter, bootstrap, vote } = await setupApp()
      await bootstrap()
      const voter = await getVoter()

      await vote(voter, 0)
      try {
        await vote(voter, 1)
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "// Voting open
          assert
          callsub alreadyvoted_6
          !
          // Hasn't already voted
          assert <--- Error
          bytec_1 // "V_"
          frame_dig -1
          concat
          box_len"
        `)
      }
    })

    test('not bootstrapped', async () => {
      const { getVoter, vote, appClient } = await setupApp()
      await appClient.fundAppAccount(algokit.microAlgos(100_000))
      const voter = await getVoter()

      try {
        await vote(voter, 0)
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "callsub allowedtovote_4
          // Allowed to vote
          assert
          callsub votingopen_5
          // Voting open
          assert <--- Error
          callsub alreadyvoted_6
          !
          // Hasn't already voted
          assert"
        `)
      }
    })

    test('invalid signature', async () => {
      const { getVoter, vote, bootstrap } = await setupApp()
      await bootstrap()
      const voter = await getVoter()
      const voter2 = await getVoter()

      try {
        await vote({ account: voter.account, signature: voter2.signature }, 0)
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "bytec_0 // ""
          frame_dig -2
          extract 2 0
          callsub allowedtovote_4
          // Allowed to vote
          assert <--- Error
          callsub votingopen_5
          // Voting open
          assert
          callsub alreadyvoted_6"
        `)
      }
    })

    test('early vote', async () => {
      const start = +new Date('2099-12-31T11:59:59Z')
      const { getVoter, vote, bootstrap } = await setupApp({ start, end: start + 1 })
      await bootstrap()
      const voter = await getVoter()

      try {
        await vote(voter, 0)
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "callsub allowedtovote_4
          // Allowed to vote
          assert
          callsub votingopen_5
          // Voting open
          assert <--- Error
          callsub alreadyvoted_6
          !
          // Hasn't already voted
          assert"
        `)
      }
    })

    test('late vote', async () => {
      const end = 2
      const { getVoter, vote, bootstrap } = await setupApp({ start: end - 1, end })
      await bootstrap()
      const voter = await getVoter()

      try {
        await vote(voter, 0)
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "callsub allowedtovote_4
          // Allowed to vote
          assert
          callsub votingopen_5
          // Voting open
          assert <--- Error
          callsub alreadyvoted_6
          !
          // Hasn't already voted
          assert"
        `)
      }
    })

    test('invalid question', async () => {
      const { appClient, getVoter, bootstrap, voteFee } = await setupApp()
      await bootstrap()
      const voter = await getVoter()

      try {
        await appClient.call({
          method: 'vote',
          methodArgs: {
            args: [
              appClient.fundAppAccount({
                amount: algokit.microAlgos(400 * /* key size */ (32 + /* value size */ 16) + 2500),
                sender: voter.account,
                sendParams: { skipSending: true },
              }),
              voter.signature,
              encodeAnswerId('a'),
            ],
            boxes: [encodeAnswerIdBoxRef('a'), voter.account],
          },
          sendParams: { fee: voteFee },
          sender: voter.account,
        })
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "box_len
          store 35
          store 34
          load 35
          // Answer ID valid
          assert <--- Error
          frame_dig -3
          gtxns Receiver
          global CurrentApplicationAddress
          =="
        `)
      }
    })
  })
})
