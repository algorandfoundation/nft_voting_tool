import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AppReference } from '@algorandfoundation/algokit-utils/types/app'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppSourceMaps } from '../features/vote-creation/state'
import { useSetConnectedWallet } from '../features/wallet/state'
import { VoteGatingSnapshot, uploadVoteGatingSnapshot, uploadVotingRound } from './IPFSGateway'
import { signCsv } from './csvSigner'
import { VotingRoundModel } from './types'
import { algod, bootstrap, castVote, closeVotingRound, create } from './votingRoundContract'

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
        await castVote(signer, signature, selectedOptionIndexes, appId, sourceMaps)
      },
    )
  },
  useCloseVotingRound: () => {
    return useSetter(async ({ signer, appId }: { signer: TransactionSignerAccount; appId: number }) => {
      await closeVotingRound(signer, appId)
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

          const app = await create(
            signer,
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
          await bootstrap(signer, app, totalQuestionOptions)
        },
      ),
    }
  },
}

export default api
