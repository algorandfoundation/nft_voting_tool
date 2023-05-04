/**
 * Returns mock data for now, this should be replaced with real API calls
 */

import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { ApplicationResponse, TealValue } from '@algorandfoundation/algokit-utils/types/algod'
import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import * as algosdk from 'algosdk'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppSourceMaps } from '../features/vote-creation/state'
import { useSetConnectedWallet } from '../features/wallet/state'
import { VoteGatingSnapshot, getVotingRound, getVotingSnapshot, uploadVoteGatingSnapshot, uploadVotingRound } from './IPFSGateway'
import { VotingRoundContract, algod, fetchTallyCounts, fetchVoterVotes, indexer } from './VotingRoundContract'
import { signCsv } from './csvSigner'
import { VotingRoundModel, VotingRoundPopulated, VotingRoundResult } from './types'

type AppState = {
  rounds: VotingRoundPopulated[]
}

const useFetchVoteRounds = (addresses: string[]) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AppState>({
    rounds: [],
  })

  const fetchData = () => {
    if (Array.isArray(addresses) && addresses.length > 0) {
      ;(async () => {
        setLoading(true)
        const votingRounds: VotingRoundPopulated[] = []
        for (const addr of addresses) {
          if (!addr) continue
          const votingRound = await fetchVotingRounds(addr)
          votingRounds.push(...votingRound)
        }
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
  }, [...addresses])

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

const useFetchVoteRoundResults = (appId: number, round?: VotingRoundPopulated) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<VotingRoundResult[] | undefined>(undefined)

  const refetch = useCallback(() => {
    ;(async () => {
      if (!round) {
        return
      }
      setLoading(true)
      const results = await fetchTallyCounts(appId, round.optionIds)
      setData(results)
      setLoading(false)
    })()
  }, [data, setData, round])

  useEffect(() => {
    refetch()
  }, [appId, round])

  return { loading, data, refetch }
}

const useFetchVoteRoundVote = (appId: number, voterAddress?: string, round?: VotingRoundPopulated) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<string[] | undefined>(undefined)

  const refetch = useCallback(() => {
    ;(async () => {
      setLoading(true)
      const answer = voterAddress && round ? await fetchVoterVotes(appId, voterAddress, round) : undefined
      setData(answer)
      setLoading(false)
    })()
  }, [voterAddress, round, data, setData])

  useEffect(() => {
    refetch()
  }, [appId, voterAddress, round])

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
    // In emergency situations, we can quickly hide particular voting rounds by app ID
    if (import.meta.env.VITE_HIDDEN_VOTING_ROUND_IDS?.split(',')?.includes(appId.toString())) {
      return undefined
    }

    const decodedState = decodeVotingRoundGlobalState(globalState)
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
      optionIds: round.questions.flatMap((q) => q.options.map((o) => o.id)),
      // questionTitle: round.questions[0].prompt,
      description: round.description,
      // todo: This is optional
      informationUrl: round.informationUrl ?? '',
      snapshot,
      closedTime: decodedState.close_time,
      nftImageUrl: decodedState.nft_image_url as string,
      nftAssetId: decodedState.nft_asset_id,
      voteGatingSnapshotCid: round.voteGatingSnapshotCid,
      created: {
        at: round.created.at,
        by: round.created.by,
      },
      hasVoteTallyBox: decodedState.total_options !== undefined,
      votedWallets: decodedState.voter_count,
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Received error trying to process voting round for app ${appId}; skipping app...`, e)
    return undefined
  }
}

const fetchVotingRound = async (appId: number) => {
  try {
    const app = await algod.getApplicationByID(appId).do()
    if (!app.params['global-state']) {
      return undefined
    }
    return getRoundFromApp(appId, app.params['global-state'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.status === 404) {
      return undefined
    }
    throw e
  }
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

const decodeVotingRoundGlobalState = (
  globalState: {
    key: string
    value: TealValue
  }[],
) => {
  const decodedState = {
    start_time: '0',
    end_time: '0',
    quorum: 0,
    close_time: undefined as string | undefined,
    metadata_ipfs_cid: '',
    is_bootstrapped: false,
    nft_image_url: undefined as string | undefined,
    nft_asset_id: undefined as number | undefined,
    voter_count: 0,
    total_options: undefined as number | undefined,
    option_counts: undefined as number[] | undefined,
  }
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
            // eslint-disable-next-line no-console
            console.error(e)
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
    const sourceMaps = useAppSourceMaps()
    return useSetter(
      async ({
        signature,
        selectedOptionIndexes,
        signer,
        appId,
      }: {
        signature: string
        selectedOptionIndexes: number[]
        signer: TransactionSignerAccount
        appId: number
      }) => {
        await VotingRoundContract(signer).castVote(signature, selectedOptionIndexes, appId, sourceMaps)
      },
    )
  },
  useVotingRounds: (addresses: string[]) => {
    return useFetchVoteRounds(addresses)
  },
  useVotingRound: (id: number) => {
    return useFetchVoteRound(id)
  },
  useVotingRoundResults: (id: number, round?: VotingRoundPopulated) => {
    return useFetchVoteRoundResults(id, round)
  },
  useVotingRoundVote: (id: number, voterAddress?: string, round?: VotingRoundPopulated) => {
    return useFetchVoteRoundVote(id, voterAddress, round)
  },
  useCloseVotingRound: () => {
    return useSetter(async ({ signer, appId }: { signer: TransactionSignerAccount; appId: number }) => {
      await VotingRoundContract(signer).closeVotingRound(appId)
    })
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
          newRound: Omit<VotingRoundModel, 'id' | 'votes' | 'snapshot'>
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

          const questions = newRound.questions.map((question) => {
            return {
              id: uuidv4(),
              prompt: question.questionTitle,
              description: question.questionDescription,
              options: question.answers.map((answer) => {
                return {
                  id: uuidv4(),
                  label: answer,
                }
              }),
            }
          })

          const voteId = `V${new Date().getTime().toString(32).toUpperCase()}`
          const { cid } = await uploadVotingRound(
            {
              id: voteId,
              title: newRound.voteTitle,
              description: newRound.voteDescription,
              informationUrl: newRound.voteInformationUrl,
              start: newRound.start,
              end: newRound.end,
              quorum: newRound.minimumVotes,
              voteGatingSnapshotCid: voteGatingSnapshotCid,
              questions,
              created: {
                at: new Date().toISOString(),
                by: signer.addr,
              },
            },
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            auth,
          )

          const questionCounts = questions.map((q) => q.options.length)

          const app = await VotingRoundContract(signer).create(
            voteId,
            publicKey,
            cid,
            Math.floor(Date.parse(newRound.start) / 1000),
            Math.floor(Date.parse(newRound.end) / 1000),
            newRound.minimumVotes ? newRound.minimumVotes : 0,
            'ipfs://bafkreiguj3svliomqnqpy2bvrlz5ud24girftynx2ywsugy7sr73zqnujy',
            questionCounts,
          )

          return app
        },
      ),
      bootstrap: useSetter(
        async ({
          signer,
          app,
          totalQuestionOptions,
        }: {
          signer: TransactionSignerAccount
          app: AppReference
          totalQuestionOptions: number
        }) => {
          await VotingRoundContract(signer).bootstrap(app, totalQuestionOptions)
        },
      ),
    }
  },
}

export default api
