/**
 * Returns mock data for now, this should be replaced with real API calls
 */

import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { ApplicationResponse, TealValue } from '@algorandfoundation/algokit-utils/types/algod'
import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { useCallback, useEffect, useState } from 'react'
import * as uuid from 'uuid'
import { v4 as uuidv4 } from 'uuid'
import { useSetConnectedWallet } from '../features/wallet/state'
import { VoteGatingSnapshot, getVotingRound, getVotingSnapshot, uploadVoteGatingSnapshot, uploadVotingRound } from './IPFSGateway'
import { VotingRoundContract, algod, fetchBoxes, indexer } from './VotingRoundContract'
import { signCsv } from './csvSigner'
import { QuestionModel, VotingRoundModel, VotingRoundPopulated, VotingRoundResult } from './types'

type AppState = {
  rounds: VotingRoundPopulated[]
}

const useFetchVoteRounds = (address: string) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AppState>({
    rounds: [],
  })

  const fetchData = () => {
    if (address) {
      ;(async () => {
        setLoading(true)
        const votingRounds = await fetchVotingRounds(address)
        setData({
          rounds: votingRounds,
        })
        setLoading(false)
      })()
    } else {
      setData({
        rounds: [],
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, [address])

  const refetch = useCallback(fetchData, [data, setData])

  return { loading, data, refetch }
}

const useFetchVoteRound = (appId: number) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<VotingRoundPopulated | undefined>(undefined)

  const refetch = useCallback(() => {
    ;(async () => {
      setLoading(true)
      const votingRound = await fetchVotingRound(appId)
      setData(votingRound)
      setLoading(false)
    })()
  }, [data, setData])

  useEffect(() => {
    refetch()
  }, [appId])

  return { loading, data, refetch }
}

const useFetchVoteRoundResults = (appId: number) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<VotingRoundResult[] | undefined>(undefined)

  const refetch = useCallback(() => {
    ;(async () => {
      setLoading(true)
      const boxes = await fetchBoxes(appId)
      const results = boxes.map((box) => ({
        optionId: uuid.stringify(box.name.nameRaw, 2),
        count: Number(box.value),
      }))
      setData(results)
      setLoading(false)
    })()
  }, [data, setData])

  useEffect(() => {
    refetch()
  }, [appId])

  return { loading, data, refetch }
}

const getRoundFromApp = async (
  appId: number,
  globalState: {
    key: string
    value: TealValue
  }[],
): Promise<VotingRoundPopulated | undefined> => {
  try {
    const decodedState = decodeGlobalState(globalState)
    if (!decodedState.is_bootstrapped || !decodedState.metadata_ipfs_cid) {
      return undefined
    }
    const round = await getVotingRound(decodedState.metadata_ipfs_cid)
    const snapshot = await getVotingSnapshot(round)
    return {
      id: appId,
      cid: decodedState.metadata_ipfs_cid,
      title: round.title,
      start: round.start,
      end: round.end,
      // todo: We are losing data here
      // answers: round.questions[0].options,
      questions: round.questions,
      // questionTitle: round.questions[0].prompt,
      description: round.description,
      // todo: This is optional
      informationUrl: round.informationUrl ?? '',
      snapshot,
      voteGatingSnapshotCid: round.voteGatingSnapshotCid,
      created: {
        at: round.created.at,
        by: round.created.by,
      },
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Received error trying to process voting round for app ${appId}; skipping app...`, e)
    return undefined
  }
}

const fetchVotingRound = async (appId: number) => {
  const app = await algod.getApplicationByID(appId).do()
  if (!app.params['global-state']) {
    return undefined
  }
  return getRoundFromApp(appId, app.params['global-state'])
}

const fetchVotingRounds = async (address: string) => {
  const voteRounds: VotingRoundPopulated[] = []
  const applicationsByCreator = await indexer.lookupAccountCreatedApplications(address).do()
  await Promise.all(
    applicationsByCreator.applications.map(async (app: ApplicationResponse) => {
      if (app.params['global-state']) {
        const round = await getRoundFromApp(app.id, app.params['global-state'])
        if (round) {
          voteRounds.push(round)
        }
      }
    }),
  )
  return voteRounds
}

const decodeGlobalState = (
  globalState: {
    key: string
    value: TealValue
  }[],
) => {
  const decodedState = {
    start_time: '0',
    end_time: '0',
    metadata_ipfs_cid: '',
    is_bootstrapped: false,
  }
  globalState.map((state) => {
    const globalKey = Buffer.from(state.key, 'base64').toString()
    if (state.value.type === 2) {
      switch (globalKey) {
        case 'start_time':
          decodedState.start_time = new Date(Number(state.value.uint)).toISOString()
          break
        case 'end_time':
          decodedState.end_time = new Date(Number(state.value.uint)).toISOString()
          break
        case 'is_bootstrapped':
          decodedState.is_bootstrapped = !!state.value.uint
          break
      }
    } else {
      switch (globalKey) {
        case 'metadata_ipfs_cid':
          decodedState.metadata_ipfs_cid = Buffer.from(state.value.bytes, 'base64').toString('utf-8')
          break
      }
    }
  })
  return decodedState
}

const useSetter = <T, K>(action: (payload: T) => Promise<K>) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const execute = useCallback((payload: T) => {
    setLoading(true)
    setError(null)
    const promise = new Promise<K>((resolve) => {
      action(payload)
        .then((state) => {
          resolve(state)
          setLoading(false)
        })
        .catch((e) => {
          setLoading(false)
          if (e instanceof Error) {
            setError(e.message)
          } else {
            setError('Unexpected error')
          }
        })
    })
    return promise
  }, [])

  return { loading, execute, error }
}

const api = {
  useConnectWallet: () => {
    const setConnectedWallet = useSetConnectedWallet()
    return useSetter((address: string) => {
      return new Promise((resolve) => {
        setConnectedWallet(address)
        resolve(true)
      })
    })
  },
  useSubmitVote: () => {
    return useSetter(
      async ({
        signature,
        selectedOption,
        signer,
        appId,
      }: {
        signature: string
        selectedOption: string
        signer: TransactionSignerAccount
        appId: number
      }) => {
        await VotingRoundContract(signer).castVote(signature, selectedOption, appId)
      },
    )
  },
  useVotingRounds: (address: string) => {
    return useFetchVoteRounds(address)
  },
  useVotingRound: (id: number) => {
    return useFetchVoteRound(id)
  },
  useVotingRoundResults: (id: number) => {
    return useFetchVoteRoundResults(id)
  },
  useCreateVotingRound: () => {
    return {
      auth: useSetter(async ({ signer }: { signer: TransactionSignerAccount }) => {
        const authTransaction = (
          await signer.signer(
            [
              (
                await algokit.transferAlgos(
                  {
                    from: signer,
                    to: signer.addr,
                    amount: algokit.algos(0),
                    note: {
                      timestamp: new Date().toISOString(),
                    },
                    skipSending: true,
                  },
                  algod,
                )
              ).transaction,
            ],
            [0],
          )
        )[0]

        return {
          address: signer.addr,
          signedTransaction: authTransaction,
        }
      }),
      create: useSetter(
        async ({
          newRound,
          signer,
          auth,
        }: {
          newRound: Omit<VotingRoundModel & QuestionModel, 'id' | 'votes' | 'snapshot'>
          signer: TransactionSignerAccount
          auth: { address: string; signedTransaction: Uint8Array }
        }) => {
          let voteGatingSnapshotCid = ''
          let publicKey = new Uint8Array([])
          let snapshot: VoteGatingSnapshot | undefined = undefined
          if (newRound.snapshotFile) {
            const { signedCsv, publicKey: _publicKey } = await signCsv(newRound.snapshotFile ? newRound.snapshotFile : '')
            publicKey = _publicKey

            snapshot = {
              title: newRound.voteTitle,
              publicKey: Buffer.from(publicKey).toString('base64'),
              snapshot: signedCsv,
              created: {
                at: new Date().toISOString(),
                by: signer.addr,
              },
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const voteGatingSnapshotResponse = await uploadVoteGatingSnapshot(snapshot, auth)
            voteGatingSnapshotCid = voteGatingSnapshotResponse.cid
          }

          const options = newRound.answers.map((answer) => {
            return {
              id: uuidv4(),
              label: answer,
            }
          })

          const { cid } = await uploadVotingRound(
            {
              title: newRound.voteTitle,
              description: newRound.voteDescription,
              informationUrl: newRound.voteInformationUrl,
              start: newRound.start,
              end: newRound.end,
              quorum: newRound.minimumVotes,
              voteGatingSnapshotCid: voteGatingSnapshotCid,
              questions: [
                {
                  id: uuidv4(),
                  prompt: newRound.questionTitle,
                  description: newRound.questionDescription,
                  options: options,
                },
              ],
              created: {
                at: new Date().toISOString(),
                by: signer.addr,
              },
            },
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            auth,
          )

          const app = await VotingRoundContract(signer).create(
            publicKey,
            cid,
            Math.floor(Date.parse(newRound.start) / 1000),
            Math.floor(Date.parse(newRound.end) / 1000),
            newRound.minimumVotes ? newRound.minimumVotes : 0,
          )

          return {
            app,
            options,
          }
        },
      ),
      bootstrap: useSetter(
        async ({
          signer,
          app,
        }: {
          signer: TransactionSignerAccount
          app: { app: AppReference; options: { id: string; label: string }[] }
        }) => {
          await VotingRoundContract(signer).bootstrap(
            app.app,
            app.options.map((option) => option.id),
          )
        },
      ),
    }
  },
}

export default api
