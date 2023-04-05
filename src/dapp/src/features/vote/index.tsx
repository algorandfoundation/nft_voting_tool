import { Alert, Box, Link, Skeleton, Stack, Typography } from '@mui/material'
import { useWallet } from '@txnlab/use-wallet'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SkeletonArray } from '../../shared/SkeletonArray'
import api from '../../shared/api'
import { LoadingDialog } from '../../shared/loading/LoadingDialog'
import { getMyVote, getVoteEnded, getVoteStarted } from '../../shared/vote'
import { useConnectedWallet } from '../wallet/state'
import { CloseVotingRound } from './CloseVotingRound'
import { VoteDetails } from './VoteDetails'
import { VoteResults } from './VoteResults'
import { VoteSubmission } from './VoteSubmission'
import { VotingTime } from './VotingTime'
import { WalletVoteStatus } from './WalletVoteStatus'

function Vote() {
  const { voteCid } = useParams()
  const { activeAddress, signer } = useWallet()
  const [allowlistSignature, setAllowlistSignature] = useState<null | string>(null)
  const [allowedToVote, setAllowToVote] = useState<boolean>(false)
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const { data, loading, refetch } = api.useVotingRound(Number(voteCid!))
  const { data: votingRoundResults, loading: loadingResults, refetch: refetchResults } = api.useVotingRoundResults(Number(voteCid!))
  const walletAddress = useConnectedWallet()
  const { loading: submittingVote, execute: submitVote, error } = api.useSubmitVote()
  const { loading: closingVotingRound, execute: closeVotingRound, error: closingVotingRoundError } = api.useCloseVotingRound()
  const voteStarted = !data ? false : getVoteStarted(data)
  const voteEnded = !data ? false : getVoteEnded(data)
  const alreadyVoted = !data ? true : getMyVote(data, walletAddress)
  const isVoteCreator = data?.created.by === activeAddress ? true : false
  const canVote = voteStarted && !voteEnded && allowedToVote && !alreadyVoted

  const handleSubmitVote = async (selectedOption: string) => {
    if (!selectedOption || !activeAddress || !allowlistSignature || !data) return
    const result = await submitVote({
      signature: allowlistSignature,
      selectedOption: selectedOption,
      signer: { addr: activeAddress, signer },
      appId: data.id,
    })
    refetchResults()
  }

  const handleCloseVotingRound = async () => {
    if (!isVoteCreator || !data || !activeAddress) return
    const result = await closeVotingRound({
      appId: data.id,
      signer: { addr: activeAddress, signer },
    })
    refetch()
  }

  useEffect(() => {
    setAllowlistSignature(null)
    setAllowToVote(false)
    if (data?.snapshot?.snapshot) {
      const addressSnapshot = data?.snapshot?.snapshot.find((addressSnapshot) => {
        return addressSnapshot.address === activeAddress
      })
      if (addressSnapshot) {
        setAllowlistSignature(addressSnapshot.signature)
        setAllowToVote(true)
      }
    }
  }, [data, activeAddress])

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          {loading ? <Skeleton className="h-12 w-1/2" variant="text" /> : <Typography variant="h3">{data?.title}</Typography>}
          {loading ? <Skeleton variant="text" /> : <Typography>{data?.description}</Typography>}

          <div className="mt-3">
            {loading ? (
              <Skeleton variant="text" className="w-56" />
            ) : (
              <Link href={data?.informationUrl ?? ''}>Learn about the vote and candidates</Link>
            )}
          </div>
          <VotingTime className="visible sm:hidden mt-4" loading={loading} round={data} />

          {isVoteCreator && (
            <CloseVotingRound
              closingVotingRoundError={closingVotingRoundError}
              loading={closingVotingRound}
              handleCloseVotingRound={handleCloseVotingRound}
              voteEnded={voteEnded}
            />
          )}

          <Typography className="mt-5" variant="h4">
            How to vote
          </Typography>

          {loading || !data ? (
            <Stack spacing={1}>
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton variant="rectangular" className="h-10" />
            </Stack>
          ) : (
            <WalletVoteStatus round={data} allowedToVote={allowedToVote} />
          )}

          {!loading && voteEnded && (
            <div className="mt-5">
              <Typography variant="h4">Vote results</Typography>
              <Box className="flex h-56 w-56 items-center justify-center border-solid border-black border-y border-x ">
                <div className="text-center">
                  <Typography>Image of NFT with vote results. Link to NFT source</Typography>
                </div>
              </Box>
            </div>
          )}
          {loading && (
            <div className="mt-7">
              <Skeleton className="h-8 w-1/2" variant="text" />
              <Skeleton variant="text" className="w-1/2" />
              <SkeletonArray className="max-w-xs" count={4} />
            </div>
          )}
          {data?.questions.map((question) => (
            <div className="mt-7" key={question.id}>
              <Typography variant="h4">{question.prompt}</Typography>

              <Typography>{question.description}</Typography>

              <div className="mt-4">
                {canVote || !voteStarted ? <VoteSubmission round={data} handleSubmitVote={handleSubmitVote} /> : null}
              </div>
              <div className="mt-4">
                {loadingResults ? (
                  <SkeletonArray className="max-w-xs" count={4} />
                ) : (
                  votingRoundResults && <VoteResults question={question} votingRoundResults={votingRoundResults} />
                )}
              </div>
              {error && (
                <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
                  <Typography>Could not cast vote:</Typography>
                  <Typography>{error}</Typography>
                </Alert>
              )}
            </div>
          ))}
        </div>
        <div>
          <VotingTime className="hidden sm:visible" loading={loading} round={data} />
          <VoteDetails loading={loading} round={data} />
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" />
    </div>
  )
}

export default Vote
