import { Box, Link, Skeleton, Stack, Typography } from '@mui/material'
import { useWallet } from '@txnlab/use-wallet'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../shared/api'
import { LoadingDialog } from '../../shared/loading/LoadingDialog'
import { SkeletonArray } from '../../shared/SkeletonArray'
import { getVoteEnded, getVoteStarted } from '../../shared/vote'
import { useConnectedWallet } from '../wallet/state'
import { CloseVotingRound } from './CloseVotingRound'
import { VoteDetails } from './VoteDetails'
import { VoteSubmission } from './VoteSubmission'
import { VotingTime } from './VotingTime'
import { WalletVoteStatus } from './WalletVoteStatus'

function Vote() {
  const { voteId: voteIdParam } = useParams()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const voteId = Number(voteIdParam!)
  const { activeAddress, signer } = useWallet()
  const [allowlistSignature, setAllowlistSignature] = useState<null | string>(null)
  const [allowedToVote, setAllowToVote] = useState<boolean>(false)
  const { data, loading, refetch } = api.useVotingRound(voteId)
  const { data: votingRoundResults, loading: loadingResults, refetch: refetchResults } = api.useVotingRoundResults(voteId, data)
  const walletAddress = useConnectedWallet()
  const { data: voteResults, loading: loadingVote, refetch: refetchVote } = api.useVotingRoundVote(voteId, walletAddress, data)
  const { loading: submittingVote, execute: submitVote, error } = api.useSubmitVote()
  const { loading: closingVotingRound, execute: closeVotingRound, error: closingVotingRoundError } = api.useCloseVotingRound()
  const voteStarted = !data ? false : getVoteStarted(data)
  const voteEnded = !data ? false : getVoteEnded(data)
  const isVoteCreator = data?.created.by === activeAddress ? true : false
  const canVote = voteStarted && !voteEnded && allowedToVote

  const handleSubmitVote = async (selectedOptions: Record<string, string>) => {
    if (!selectedOptions || !activeAddress || !allowlistSignature || !data) return
    await submitVote({
      signature: allowlistSignature,
      selectedOptionIndexes: data.questions.map((question) => question.options.map((o) => o.id).indexOf(selectedOptions[question.id])),
      signer: { addr: activeAddress, signer },
      appId: data.id,
    })
    refetchResults()
    refetchVote?.()
  }

  const handleCloseVotingRound = async () => {
    if (!isVoteCreator || !data || !activeAddress) return
    await closeVotingRound({
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
    <div className="max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          {loading ? <Skeleton className="h-12 w-1/2" variant="text" /> : <Typography variant="h3">{data?.title}</Typography>}
          {loading ? <Skeleton variant="text" /> : <Typography>{data?.description}</Typography>}

          <div className="mt-3">
            {loading ? (
              <Skeleton variant="text" className="w-56" />
            ) : (
              data?.informationUrl && (
                <Link href={data.informationUrl} target="_blank">
                  Learn more about the vote.
                </Link>
              )
            )}
          </div>
          <VotingTime className="visible sm:hidden mt-4" loading={loading} round={data} />

          {isVoteCreator && !data?.closedTime && data?.nftImageUrl && (
            <CloseVotingRound
              closingVotingRoundError={closingVotingRoundError}
              loading={closingVotingRound}
              handleCloseVotingRound={handleCloseVotingRound}
              voteEnded={voteEnded}
            />
          )}

          {!voteEnded && (
            <>
              {loading || !data ? (
                <Stack spacing={1}>
                  <Skeleton variant="text" className="w-1/2" />
                  <Skeleton variant="rectangular" className="h-10" />
                </Stack>
              ) : (
                <>
                  <Typography className="mt-5" variant="h4">
                    How to vote
                  </Typography>
                  <WalletVoteStatus round={data} allowedToVote={allowedToVote} myVotes={voteResults} />
                </>
              )}
            </>
          )}
          {!loading && voteEnded && (
            <div className="mt-5">
              <Typography variant="h4">Vote results</Typography>
              {!!data?.nftAssetId && (
                <>
                  <Box className="flex h-56 w-56 items-center justify-center border-solid border-black border-y border-x ">
                    <div className="text-center">
                      <Typography>
                        <img
                          src={data.nftImageUrl?.replace('ipfs://', `${import.meta.env.VITE_IPFS_GATEWAY_URL}/`)}
                          alt="Voting round result NFT image"
                          className="max-h-full max-w-full"
                        />
                      </Typography>
                    </div>
                  </Box>
                  <Typography>
                    <a href={`${import.meta.env.VITE_NFT_EXPLORER_URL}${data.nftAssetId}`} target="_blank">
                      View voting result NFT details
                    </a>
                  </Typography>
                </>
              )}
            </div>
          )}
          {loading && (
            <div className="mt-7">
              <Skeleton className="h-8 w-1/2" variant="text" />
              <Skeleton variant="text" className="w-1/2" />
              <SkeletonArray className="max-w-xs" count={4} />
            </div>
          )}
          <VoteSubmission
            round={data}
            voteResults={votingRoundResults}
            canVote={canVote}
            loadingResults={loadingResults}
            loadingVote={loadingVote}
            votingError={error}
            existingAnswers={voteResults}
            handleSubmitVote={handleSubmitVote}
          />
        </div>
        <div>
          <VotingTime className="hidden sm:visible" loading={loading} round={data} />
          <VoteDetails loading={loading} round={data} />
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" note="Please check your wallet for any pending transactions" />
    </div>
  )
}

export default Vote
