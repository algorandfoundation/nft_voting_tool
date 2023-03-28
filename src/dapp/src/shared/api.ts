/**
 * Returns mock data for now, this should be replaced with real API calls
 */

import { useCallback, useEffect, useState } from 'react'
import { atom, useRecoilValue, useSetRecoilState } from 'recoil'
import { v4 as uuid } from 'uuid'
import { useSetConnectedWallet } from '../features/wallet/state'
import { Vote, VotingRound } from './types'

type AppState = {
  rounds: VotingRound[]
}

const votingRoundsAtom = atom<AppState>({
  key: 'appState',
  default: {
    rounds: [
      {
        id: 'b34fb9cb-7e69-4ac6-a6cb-976edf1fd8d8',
        voteTitle: 'Algorand Council',
        voteDescription: 'This is the vote description',
        start: '2023-03-01T00:00:00.000Z',
        voteInformationUrl: 'https://www.algorand.com',
        questionDescription: 'Select the best candidate!',
        end: '2023-04-21T00:00:00.000Z',
        questionTitle: 'Who should be on the council?',
        answers: ['Sammy', 'Charlotte', 'Roman', 'Maxine'],
        snapshotFile: 'wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I',
        votes: [],
      },
      {
        id: '222fb9cb-7e69-4ac6-a6cb-976edf1fd8d8',
        voteTitle: 'Future vote',
        voteDescription: 'This is the vote description',
        start: '2024-03-01T00:00:00.000Z',
        voteInformationUrl: 'https://www.algorand.com',
        questionDescription: 'Select the best candidate!',
        end: '2024-04-21T00:00:00.000Z',
        questionTitle: 'Who should be on the council?',
        answers: ['Sammy', 'Charlotte', 'Roman', 'Maxine'],
        snapshotFile: 'wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I',
        votes: [],
      },

      {
        id: '129c3c52-1961-4e42-b88b-2a42cc5b50ca',
        voteTitle: 'Another Round',
        start: '2023-02-26T00:00:00.000Z',
        end: '2023-03-06T00:00:00.000Z',
        answers: ['Yes', 'No'],
        questionTitle: 'Should we do this?',
        voteDescription: 'This is the vote description',
        voteInformationUrl: 'https://www.algorand.com',
        votes: [],
        snapshotFile: 'wallet-one\nwallet-two\nwallet-three\nPERAG7V9V3SR9ZBTO690MV6I',
      },
      {
        id: '4727d3e7-6cfb-4530-a4c9-980c0a3ba90f',
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

const useMockSetter = <T, K>(action: (payload: T) => Promise<K>, extraDelayMs = 0) => {
  const [loading, setLoading] = useState(false)
  const execute = useCallback((payload: T) => {
    setLoading(true)
    const promise = new Promise<K>((resolve) =>
      setTimeout(async () => {
        const state = await action(payload)
        setLoading(false)
        resolve(state)
        // simulate loading time
      }, Math.random() * 400 + extraDelayMs),
    )
    return promise
  }, [])

  return { loading, execute }
}

const useSetter = <T, K>(action: (payload: T) => Promise<K>) => {
  const [loading, setLoading] = useState(false)
  const execute = useCallback((payload: T) => {
    setLoading(true)
    const promise = new Promise<K>((resolve) => {
      action(payload).then((state) => {
        resolve(state)
        setLoading(false)
      })
    })
    return promise
  }, [])

  return { loading, execute }
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
  useSubmitVote: (roundId: string) => {
    const setState = useSetRecoilState(votingRoundsAtom)
    return useMockSetter<Vote, AppState>(({ selectedOption, walletAddress }) => {
      return new Promise((resolve) => {
        setState((state) => {
          const round = state.rounds.find((p) => p.id === roundId)
          if (!round) {
            resolve(state)
            return state
          }
          const newState = {
            ...state,
            openRounds: [
              ...state.rounds.filter((p) => p.id !== roundId),
              {
                ...round,
                votes: [
                  ...round.votes,
                  {
                    walletAddress,
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
    }, 2000)
  },
  useVotingRounds: () => {
    const data = useRecoilValue(votingRoundsAtom)
    return useMockGetter({
      ...data,
    })
  },
  useVotingRound: (id: string) => {
    const data = useRecoilValue(votingRoundsAtom)
    return useMockGetter([...data.rounds].find((round) => round.id === id))
  },
  useAddVotingRound: () => {
    const setState = useSetRecoilState(votingRoundsAtom)
    return useMockSetter((newRound: Omit<VotingRound, 'id' | 'votes'>) => {
      return new Promise((resolve) => {
        setState((state) => {
          const newState = {
            ...state,
            openRounds: [
              ...state.rounds,
              {
                ...newRound,
                id: uuid(),
                votes: [],
              },
            ],
          }
          resolve(newState)
          return newState
        })
      })
    }, 3000)
  },
}

export default api
