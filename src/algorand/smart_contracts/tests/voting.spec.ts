/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, describe, beforeEach, beforeAll } from '@jest/globals'
import * as algokit from '@algorandfoundation/algokit-utils'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import fs from 'fs/promises'
import path from 'path'
import { Account } from 'algosdk'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import * as ed from '@noble/ed25519'
import invariant from 'tiny-invariant'
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
    questionCounts?: number[]
    nftImageUrl?: string
  }) => {
    let { voteId, cid, start, end, quorum, questionCounts, nftImageUrl } = setup ?? {}
    const { algod, testAccount } = localnet.context

    const status = await algod.status().do()
    const lastRound = Number(status['last-round'])
    const round = await algod.block(lastRound).do()
    const currentTime = Number(round.block.ts)

    const voteFee = algokit.microAlgos(1_000 + 11 /* opup - 700 x 11 to get 7700 */ * 1_000)

    const privateKey = Buffer.from(ed.utils.randomPrivateKey())
    const publicKey = await ed.getPublicKey(privateKey)

    voteId = voteId ?? `V${new Date().getTime().toString(32).toUpperCase()}`
    cid = cid ?? 'CID'
    start = start ?? currentTime
    end = end !== undefined ? start + end : currentTime + 1000
    quorum = quorum ?? Math.ceil(Math.random() * 1000)
    const questionCount = questionCounts ? questionCounts.length : Math.ceil(Math.random() * 10)
    questionCounts = questionCounts ?? new Array(questionCount).fill(0).map((_) => Math.ceil(Math.random() * 10))
    nftImageUrl = nftImageUrl ?? 'ipfs://cid'
    const totalQuestionOptions = questionCounts.reduce((a, b) => a + b, 0)

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
      methodArgs: [voteId, publicKey, cid, start, end, questionCounts, quorum, nftImageUrl],
      deletable: false,
      sendParams: { fee: (1_000 + 1_000 * 4).microAlgos() },
    })

    const getTallies = async () => {
      return await appClient.getBoxValueFromABIType(
        'V',
        new algosdk.ABIArrayStaticType(new algosdk.ABIUintType(64), totalQuestionOptions),
      )
    }

    const bootstrap = async () => {
      return await appClient.call({
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

    const vote = async (voter: { account: Account; signature: Uint8Array }, questionIndexes?: number[]) => {
      questionIndexes = questionIndexes ?? questionCounts!.map((x) => x - 1)
      return await appClient.call({
        method: 'vote',
        methodArgs: {
          args: [
            appClient.fundAppAccount({
              amount: algokit.microAlgos(
                400 * /* key size */ (32 + /* value size */ 2 + questionIndexes.length * 1) + 2500,
              ),
              sender: voter.account,
              sendParams: { skipSending: true },
            }),
            voter.signature,
            questionIndexes,
          ],
          boxes: ['V', voter.account],
        },
        sendParams: { fee: voteFee },
        sender: voter.account,
      })
    }

    const close = async () => {
      return await appClient.call({
        method: 'close',
        methodArgs: {
          args: [],
          boxes: ['V'],
        },
        sendParams: { fee: algokit.microAlgos(1_000 + 29 /* opup - 700 x 30 to get 20000 */ * 1_000) },
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
      nftImageUrl,
      app,
      questions: questionCounts,
      totalQuestionOptions,
      bootstrap,
      getVoter,
      voteFee,
      vote,
      close,
      getTallies,
    }
  }

  test('create', async () => {
    const { appClient, publicKey, cid, start, end, quorum, nftImageUrl, questions, totalQuestionOptions } =
      await setupApp()

    const globalState = await appClient.getGlobalState()
    invariant('valueRaw' in globalState.snapshot_public_key)
    expect(globalState.snapshot_public_key.valueRaw).toEqual(publicKey)

    expect(globalState.metadata_ipfs_cid.value).toBe(cid)
    expect(globalState.start_time.value).toBe(start)
    expect(globalState.end_time.value).toBe(end)
    expect(globalState.close_time.value).toBe(0)
    expect(globalState.quorum.value).toBe(quorum)
    expect(globalState.is_bootstrapped.value).toBe(0)
    expect(globalState.voter_count.value).toBe(0)
    expect(globalState.nft_image_url.value).toBe(nftImageUrl)
    expect(globalState.nft_asset_id.value).toBe(0)
    expect(globalState.total_options.value).toBe(totalQuestionOptions)
    invariant('valueRaw' in globalState.option_counts)
    const optionCountsType = new algosdk.ABIArrayDynamicType(new algosdk.ABIUintType(8))
    expect(optionCountsType.decode(globalState.option_counts.valueRaw).map(Number)).toEqual(questions)

    const boxes = await appClient.getBoxNames()
    expect(boxes.length).toBe(0)
  })

  test('bootstrap', async () => {
    const { appClient, bootstrap, getTallies } = await setupApp({ questionCounts: [4] })

    await bootstrap()

    const globalState = await appClient.getGlobalState()
    expect(globalState.is_bootstrapped.value).toBe(1)

    const boxes = await appClient.getBoxNames()
    expect(boxes.map((b) => b.name)).toEqual(['V'])

    const boxValues = await getTallies()
    expect(boxValues).toEqual([0n, 0n, 0n, 0n])
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
        bytec 4 // "is_bootstrapped"
        app_global_get
        !
        // Already bootstrapped
        assert <--- Error
        bytec 4 // "is_bootstrapped"
        intc_1 // 1
        app_global_put
        pushint 203900 // 203900"
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
      const { close, getVoter, vote, bootstrap, appClient, currentTime, quorum, voteId, cid } = await setupApp({
        questionCounts: [3, 1, 1, 1, 3],
      })
      await bootstrap()
      const voter = await getVoter()
      await vote(voter)
      const voter2 = await getVoter()
      await vote(voter2)

      const result = await close()

      const globalState = await appClient.getGlobalState()
      invariant(result.confirmation)
      invariant(result.confirmation?.['inner-txns'])
      const inner = result.confirmation['inner-txns'][result.confirmation['inner-txns'].length - 1]
      expect(inner['asset-index']).not.toBe(0)
      expect(inner['asset-index']).toBe(globalState.nft_asset_id.value)
      expect(globalState.close_time.value).toBeGreaterThanOrEqual(currentTime)
      let arc69Payload: any = {}
      try {
        arc69Payload = JSON.parse(
          Buffer.from(inner.txn.txn.note ?? new Uint8Array())
            .toString('utf-8')
            .replace(new RegExp(voteId, 'g'), '{VOTE_ID}')
            .replace(new RegExp(quorum.toString(), 'g'), '"{QUORUM}"')
            .replace(new RegExp(cid, 'g'), '{CID}'),
        )
      } catch (e) {
        console.error(e)
        console.log('Received this payload', Buffer.from(inner.txn.txn.note ?? new Uint8Array()).toString('utf-8'))
        throw e
      }

      expect(arc69Payload).toBeTruthy()
      expect(JSON.stringify(arc69Payload, undefined, 2)).toMatchInlineSnapshot(`
        "{
          "standard": "arc69",
          "description": "This is a voting result NFT for voting round with ID {VOTE_ID}.",
          "properties": {
            "metadata": "ipfs://{CID}",
            "id": "{VOTE_ID}",
            "quorum": "{QUORUM}",
            "voterCount": 2,
            "tallies": [
              [
                0,
                0,
                2
              ],
              [
                2
              ],
              [
                2
              ],
              [
                2
              ],
              [
                0,
                0,
                2
              ]
            ]
          }
        }"
      `)
    })

    test('max budget 1', async () => {
      try {
        const questionCounts = new Array(112).fill(1)
        questionCounts[0] = 128 - 112
        const { close, getVoter, vote, bootstrap } = await setupApp({
          questionCounts,
        })
        await bootstrap()
        const voter = await getVoter()
        await vote(voter)
        const voter2 = await getVoter()
        await vote(voter2)

        await close()
      } catch (e: any) {
        console.error(e.led.traces[0])
        throw e
      }
    })

    test('max budget 2', async () => {
      try {
        const { close, getVoter, vote, bootstrap } = await setupApp({
          questionCounts: new Array(64).fill(2),
        })
        await bootstrap()
        const voter = await getVoter()
        await vote(voter)
        const voter2 = await getVoter()
        await vote(voter2)

        await close()
      } catch (e: any) {
        console.error(e.led.traces[0])
        throw e
      }
    })

    test('max budget 3', async () => {
      const { close, getVoter, vote, bootstrap } = await setupApp({
        questionCounts: [128],
      })
      await bootstrap()
      const voter = await getVoter()
      await vote(voter)
      const voter2 = await getVoter()
      await vote(voter2)

      await close()
    })
  })

  describe('vote', () => {
    test('successful single question (first index)', async () => {
      const { getVoter, vote, bootstrap, getTallies } = await setupApp({ questionCounts: [4] })
      await bootstrap()
      const voter = await getVoter()

      await vote(voter, [0])

      const boxValues = await getTallies()
      expect(boxValues).toEqual([1n, 0n, 0n, 0n])
    })

    test('successful single question (last index)', async () => {
      const { getVoter, vote, bootstrap, getTallies } = await setupApp({ questionCounts: [4] })
      await bootstrap()
      const voter = await getVoter()

      await vote(voter, [3])

      const boxValues = await getTallies()
      expect(boxValues).toEqual([0n, 0n, 0n, 1n])
    })

    test('successful multiple questions (first index)', async () => {
      const { getVoter, vote, bootstrap, getTallies } = await setupApp({ questionCounts: [4, 4] })
      await bootstrap()
      const voter = await getVoter()

      await vote(voter, [0, 0])

      const boxValues = await getTallies()
      expect(boxValues).toEqual([1n, 0n, 0n, 0n, 1n, 0n, 0n, 0n])
    })

    test('successful multiple questions (last index)', async () => {
      const { getVoter, vote, bootstrap, getTallies } = await setupApp({ questionCounts: [4, 4] })
      await bootstrap()
      const voter = await getVoter()

      await vote(voter, [3, 3])

      const boxValues = await getTallies()
      expect(boxValues).toEqual([0n, 0n, 0n, 1n, 0n, 0n, 0n, 1n])
    })

    test('double voting', async () => {
      const { getVoter, bootstrap, vote } = await setupApp({ questionCounts: [2] })
      await bootstrap()
      const voter = await getVoter()

      await vote(voter, [0])
      try {
        await vote(voter, [1])
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "// Voting not open
          assert
          callsub alreadyvoted_6
          !
          // Already voted
          assert <--- Error
          bytec_3 // "option_counts"
          app_global_get
          frame_bury 0
          frame_dig 0"
        `)
      }
    })

    test('not bootstrapped', async () => {
      const { getVoter, vote, appClient } = await setupApp({ questionCounts: [1] })
      await appClient.fundAppAccount(algokit.microAlgos(100_000))
      const voter = await getVoter()

      try {
        await vote(voter, [0])
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "callsub allowedtovote_4
          // Not allowed to vote
          assert
          callsub votingopen_5
          // Voting not open
          assert <--- Error
          callsub alreadyvoted_6
          !
          // Already voted
          assert"
        `)
      }
    })

    test('invalid signature', async () => {
      const { getVoter, vote, bootstrap } = await setupApp({ questionCounts: [1] })
      await bootstrap()
      const voter = await getVoter()
      const voter2 = await getVoter()

      try {
        await vote({ account: voter.account, signature: voter2.signature }, [0])
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "bnz vote_9_l5
          frame_dig -2
          extract 2 0
          callsub allowedtovote_4
          // Not allowed to vote
          assert <--- Error
          callsub votingopen_5
          // Voting not open
          assert
          callsub alreadyvoted_6"
        `)
      }
    })

    test('early vote', async () => {
      const start = +new Date('2099-12-31T11:59:59Z')
      const { getVoter, vote, bootstrap } = await setupApp({ start, end: 1, questionCounts: [1] })
      await bootstrap()
      const voter = await getVoter()

      try {
        await vote(voter, [0])
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "callsub allowedtovote_4
          // Not allowed to vote
          assert
          callsub votingopen_5
          // Voting not open
          assert <--- Error
          callsub alreadyvoted_6
          !
          // Already voted
          assert"
        `)
      }
    })

    test('late vote', async () => {
      const { getVoter, vote, bootstrap, algod } = await setupApp({ end: 0, questionCounts: [1] })
      await bootstrap()
      const voter = await getVoter()

      try {
        //todo: const response = await algod.c.post('v2/blocks/offset/2000', null)
        await vote(voter, [0])
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "callsub allowedtovote_4
          // Not allowed to vote
          assert
          callsub votingopen_5
          // Voting not open
          assert <--- Error
          callsub alreadyvoted_6
          !
          // Already voted
          assert"
        `)
      }
    })

    test('invalid option', async () => {
      const { appClient, getVoter, bootstrap, voteFee, questions } = await setupApp({ questionCounts: [1] })
      await bootstrap()
      const voter = await getVoter()

      try {
        await appClient.call({
          method: 'vote',
          methodArgs: {
            args: [
              appClient.fundAppAccount({
                amount: algokit.microAlgos(
                  400 * /* key size */ (32 + /* value size */ 2 + questions.length * 1) + 2500,
                ),
                sender: voter.account,
                sendParams: { skipSending: true },
              }),
              voter.signature,
              [1],
            ],
            boxes: ['V', voter.account],
          },
          sendParams: { fee: voteFee },
          sender: voter.account,
        })
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "frame_bury 7
          frame_dig 5
          frame_dig 7
          <
          // Answer option index invalid
          assert <--- Error
          pushint 8 // 8
          load 52
          frame_dig 5
          +"
        `)
      }
    })

    test('invalid question', async () => {
      const { appClient, getVoter, bootstrap, voteFee, questions } = await setupApp({ questionCounts: [1] })
      await bootstrap()
      const voter = await getVoter()

      try {
        await appClient.call({
          method: 'vote',
          methodArgs: {
            args: [
              appClient.fundAppAccount({
                amount: algokit.microAlgos(
                  400 * /* key size */ (32 + /* value size */ 2 + questions.length * 1) + 2500,
                ),
                sender: voter.account,
                sendParams: { skipSending: true },
              }),
              voter.signature,
              [0, 0],
            ],
            boxes: ['V', voter.account],
          },
          sendParams: { fee: voteFee },
          sender: voter.account,
        })
        invariant(false)
      } catch (e: any) {
        expect(e.stack).toMatchInlineSnapshot(`
          "frame_bury 2
          frame_dig 2
          load 50
          ==
          // Number of answers incorrect
          assert <--- Error
          pushint 2500 // 2500
          pushint 34 // 34
          intc_1 // 1
          frame_dig -1"
        `)
      }
    })
  })
})
