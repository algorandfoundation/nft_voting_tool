/**
 * Returns mock data for now, this should be replaced with real API calls
 */

import { ApplicationResponse, TealValue } from '@algorandfoundation/algokit-utils/types/algod'
import * as ed from '@noble/ed25519'
import { TransactionSigner } from 'algosdk'
import { useCallback, useEffect, useState } from 'react'
import { atom, useRecoilValue, useSetRecoilState } from 'recoil'
import { v4 as uuidv4 } from 'uuid'
import { useSetConnectedWallet } from '../features/wallet/state'
import { signCsv } from './csvSigner'
import { uploadVoteGatingSnapshot, uploadVotingRound } from './IPFSGateway'
import { VotingRound } from './types'
import { indexer, VotingRoundContract } from './VotingRoundContract'

type AppState = {
  rounds: VotingRound[]
}

export const votingRoundsAtom = atom<AppState>({
  key: 'appState',
  default: {
    rounds: [
      {
        id: 1,
        voteTitle: 'Algorand Council',
        voteDescription: 'This is the vote description',
        start: '2023-03-01T00:00:00.000Z',
        voteInformationUrl: 'https://www.algorand.com',
        questionDescription: 'Select the best candidate!',
        end: '2023-04-21T00:00:00.000Z',
        questionTitle: 'Who should be on the council?',
        answers: ['Sammy', 'Charlotte', 'Roman', 'Maxine'],
        snapshotFile:
          'wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I\nALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU',
        votes: [],
      },
      {
        id: 2,
        voteTitle: 'Future vote',
        voteDescription: 'This is the vote description',
        start: '2024-03-01T00:00:00.000Z',
        voteInformationUrl: 'https://www.algorand.com',
        questionDescription: 'Select the best candidate!',
        end: '2024-04-21T00:00:00.000Z',
        questionTitle: 'Who should be on the council?',
        answers: ['Sammy', 'Charlotte', 'Roman', 'Maxine'],
        snapshotFile:
          'wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I\nALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU',
        votes: [],
      },

      {
        id: 3,
        voteTitle: 'Another Round',
        start: '2023-02-26T00:00:00.000Z',
        end: '2023-03-06T00:00:00.000Z',
        answers: ['Yes', 'No'],
        questionTitle: 'Should we do this?',
        voteDescription: 'This is the vote description',
        voteInformationUrl: 'https://www.algorand.com',
        votes: [],
        snapshotFile:
          'wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I\nALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU',
      },
      {
        id: 4,
        voteTitle: 'An earlier vote',
        start: '2023-02-18T00:00:00.000Z',
        end: '2023-02-23T00:00:00.000Z',
        answers: ['Yes', 'No', 'Maybe'],
        questionTitle: 'Will you answer Yes, No or Maybe?',
        voteDescription: 'This is the vote description',
        voteInformationUrl: 'https://www.algorand.com',
        votes: [],
      },
    ],
  },
})

const useMockGetter = <T>(payload: T) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
      setData(payload)
      // simulate loading time
    }, Math.random() * 400)
    return () => clearTimeout(timeout)
  }, [])

  const refetch = useCallback(
    (newPayload: T) => {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setData({ ...newPayload })
        // simulate loading time
      }, Math.random() * 400)
    },
    [data, setData],
  )
  return { loading, data, refetch }
}

const useFetchVoteRounds = (address: string) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AppState>({
    rounds: [],
  })

  useEffect(() => {
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
  }, [address])

  const refetch = useCallback(() => {
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
  }, [data, setData])

  return { loading, data, refetch }
}

const fetchVotingRounds = async (address: string) => {
  const voteRounds: VotingRound[] = []
  const applicationsByCreator = await indexer.lookupAccountCreatedApplications(address).do()
  applicationsByCreator.applications.map((app: ApplicationResponse) => {
    if (app.params['global-state']) {
      const decodedState = decodeGlobalState(app.params['global-state'])
      const voteRound = {
        id: app.id,
        voteTitle: `Vote Round for App ID: ${app.id}`,
        start: decodedState.start_time,
        end: decodedState.end_time,
        answers: ['Yes', 'No'],
        questionTitle: 'Should we do this?',
        voteDescription: 'This is the vote description',
        voteInformationUrl: 'https://www.algorand.com',
        votes: [],
        snapshotFile:
          'wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I\nALF62RMQWIAT6JO2U4M6N2XWJYM7T2XB5KFWP3K6LXH6KUG73EXFXEABAU',
      }
      voteRounds.push(voteRound)
    }
  })
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
        resolve(address)
      })
    })
  },
  useSubmitVote: (roundId: number) => {
    const setState = useSetRecoilState(votingRoundsAtom)
    return useSetter(
      async ({
        activeAddress,
        signature,
        selectedOption,
        signer,
        appId,
      }: {
        activeAddress: string
        signature: string
        selectedOption: string
        signer: TransactionSigner
        appId: number
      }) => {
        const votingRoundContract = VotingRoundContract(activeAddress, signer)
        const transaction = await votingRoundContract.castVote(signature, selectedOption, appId)
        return await new Promise((resolve) => {
          setState((state) => {
            const round = state.rounds.find((p) => p.id === roundId)
            if (!round) {
              resolve(state)
              return state
            }
            const newState = {
              ...state,
              openRounds: [
                ...state.rounds.filter((p_1) => p_1.id !== roundId),
                {
                  ...round,
                  votes: [
                    ...round.votes,
                    {
                      walletAddress: activeAddress,
                      selectedOption,
                    },
                  ],
                },
              ],
            }
            resolve(newState)
            return newState
          })
        })
      },
    )
  },
  useVotingRounds: (address: string) => {
    return useFetchVoteRounds(address)
  },
  useVotingRound: (id: number) => {
    const data = useRecoilValue(votingRoundsAtom)
    return useMockGetter([...data.rounds].find((round) => round.id === id))
  },
  useCreateVotingRound: () => {
    const setState = useSetRecoilState(votingRoundsAtom)
    return useSetter(
      async ({
        newRound,
        activeAddress,
        signer,
      }: {
        newRound: Omit<VotingRound, 'id' | 'votes'>
        activeAddress: string
        signer: TransactionSigner
      }) => {
        const privateKey = ed.utils.randomPrivateKey()
        const publicKey = await ed.getPublicKeyAsync(privateKey)
        let voteGatingSnapshotCid = ''
        if (newRound.snapshotFile) {
          const signedCsv = await signCsv(newRound.snapshotFile ? newRound.snapshotFile : '', privateKey)

          const voteGatingSnapshotResponse = await uploadVoteGatingSnapshot({
            title: newRound.voteTitle,
            publicKey: Buffer.from(publicKey).toString('base64'),
            snapshot: signedCsv,
            created: {
              at: new Date().toISOString(),
              by: activeAddress,
            },
          })
          voteGatingSnapshotCid = voteGatingSnapshotResponse.cid
          console.log(voteGatingSnapshotResponse, voteGatingSnapshotCid)
        }

        const options = newRound.answers.map((answer) => {
          return {
            id: uuidv4(),
            label: answer,
          }
        })
        const { cid } = await uploadVotingRound({
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
            by: activeAddress,
          },
        })

        const votingRoundContract = VotingRoundContract(activeAddress, signer)
        const app = await votingRoundContract.create(
          publicKey,
          cid,
          Date.parse(newRound.start),
          Date.parse(newRound.end),
          newRound.minimumVotes ? newRound.minimumVotes : 0,
        )
        await votingRoundContract.bootstrap(
          app,
          options.map((option) => option.id),
        )

        return new Promise((resolve) => {
          setState((state) => {
            const newState = {
              ...state,
              rounds: [
                ...state.rounds,
                {
                  ...newRound,
                  id: app.appId,
                  votes: [],
                },
              ],
            }
            resolve(newState)
            return newState
          })
        })
      },
    )
  },
}

export default api
