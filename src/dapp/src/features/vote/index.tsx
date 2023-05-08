import { Alert, Box, Link, Skeleton, Stack, Typography } from '@mui/material'
import { useWallet } from '@txnlab/use-wallet'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { VoteGatingSnapshot, VotingRoundMetadata, fetchVotingRoundMetadata, fetchVotingSnapshot } from '../../shared/IPFSGateway'
import { SkeletonArray } from '../../shared/SkeletonArray'
import {
  TallyCounts,
  VotingRoundGlobalState,
  fetchTallyCounts,
  fetchVoterVotes,
  fetchVotingRoundGlobalState,
} from '../../shared/VotingRoundContract'
import api from '../../shared/api'
import { LoadingDialog } from '../../shared/loading/LoadingDialog'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
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
  const navigate = useNavigate()

  const [votingRoundGlobalState, setVotingRoundGlobalState] = useState<VotingRoundGlobalState | undefined>(undefined)
  const [votingRoundMetadata, setVotingRoundMetadata] = useState<VotingRoundMetadata | undefined>(undefined)
  const [snapshot, setSnapshot] = useState<VoteGatingSnapshot | undefined>(undefined)
  const [votingRoundResults, setVotingRoundResults] = useState<TallyCounts | undefined>(undefined)
  const [voterVotes, setVoterVotes] = useState<string[] | undefined>(undefined)

  const [isLoadingVotingRoundData, setIsLoadingVotingRoundData] = useState(true)
  const [isLoadingVotersVote, setIsLoadingVotersVote] = useState(true)
  const [isLoadingVotingRoundResults, setIsLoadingVotingRoundResults] = useState(true)
  const isLoadingResults = isLoadingVotersVote || isLoadingVotingRoundResults

  const [error, setError] = useState<string | null>(null)

  const [allowlistSignature, setAllowlistSignature] = useState<null | string>(null)
  const [allowedToVote, setAllowToVote] = useState<boolean>(false)

  const { loading: submittingVote, execute: submitVote, error: errorSubmittingVote } = api.useSubmitVote()
  const { loading: closingVotingRound, execute: closeVotingRound, error: closingVotingRoundError } = api.useCloseVotingRound()

  const hasVoteStarted = !votingRoundGlobalState ? false : getHasVoteStarted(votingRoundGlobalState)
  const hasVoteEnded = !votingRoundGlobalState ? false : getHasVoteEnded(votingRoundGlobalState)
  const isVoteCreator = votingRoundMetadata?.created.by === activeAddress ? true : false
  const canVote = hasVoteStarted && !hasVoteEnded && allowedToVote

  if (voteIdParam && import.meta.env.VITE_HIDDEN_VOTING_ROUND_IDS?.split(',')?.includes(voteIdParam)) {
    navigate('/')
  }

  useEffect(() => {
    refetchVoteRoundData(voteId)
  }, [voteId])

  useEffect(() => {
    refetchVotersVote(voteId, activeAddress, votingRoundMetadata, votingRoundGlobalState)
  }, [voteId, activeAddress, votingRoundMetadata, votingRoundGlobalState])

  useEffect(() => {
    refetchVoteResults(voteId, votingRoundMetadata)
  }, [voteId, votingRoundMetadata])

  const refetchVoteRoundData = async (voteId: number | undefined) => {
    setVotingRoundGlobalState(undefined)
    setVotingRoundMetadata(undefined)
    setSnapshot(undefined)
    setError(null)
    if (voteId) {
      setIsLoadingVotingRoundData(true)
      try {
        const globalState = await fetchVotingRoundGlobalState(voteId)
        if (!globalState) {
          throw new Error(`Could not retrieve voting round global state with appId: ${voteId}`)
        }

        const roundMetadata = await fetchVotingRoundMetadata(globalState.metadata_ipfs_cid)
        if (!roundMetadata) {
          throw new Error(`Could not retrieve voting round metadata with cid: ${globalState.metadata_ipfs_cid}`)
        }

        if (roundMetadata.voteGatingSnapshotCid) {
          const snapshot = await fetchVotingSnapshot(roundMetadata.voteGatingSnapshotCid)
          setSnapshot(snapshot)
        }

        setVotingRoundGlobalState(globalState)
        setVotingRoundMetadata(roundMetadata)
        setIsLoadingVotingRoundData(false)
      } catch (e) {
        setIsLoadingVotingRoundData(false)
        handleError(e)
      }
    } else {
      setError('The app id must be defined')
    }
  }

  const refetchVotersVote = async (
    voteId: number | undefined,
    walletAddress: string | undefined,
    votingRoundMetadata: VotingRoundMetadata | undefined,
    votingRoundGlobalState: VotingRoundGlobalState | undefined,
  ) => {
    if (voteId && walletAddress && votingRoundMetadata && votingRoundGlobalState) {
      setIsLoadingVotersVote(true)
      try {
        setVoterVotes(await fetchVoterVotes(voteId, walletAddress, votingRoundMetadata, votingRoundGlobalState))
        setIsLoadingVotersVote(false)
      } catch (e) {
        setIsLoadingVotersVote(false)
        handleError(e)
      }
    } else {
      setIsLoadingVotersVote(false)
      setVoterVotes(undefined)
    }
  }

  const refetchVoteResults = async (voteId: number | undefined, votingRoundMetadata: VotingRoundMetadata | undefined) => {
    if (voteId && votingRoundMetadata) {
      setIsLoadingVotingRoundResults(true)
      try {
        setVotingRoundResults(await fetchTallyCounts(voteId, votingRoundMetadata))
        setIsLoadingVotingRoundResults(false)
      } catch (e) {
        setIsLoadingVotingRoundResults(false)
        handleError(e)
      }
    } else {
      setIsLoadingVotingRoundResults(false)
      setVotingRoundResults(undefined)
    }
  }

  useEffect(() => {
    setAllowlistSignature(null)
    setAllowToVote(false)
    if (snapshot?.snapshot) {
      const addressSnapshot = snapshot?.snapshot.find((addressSnapshot) => {
        return addressSnapshot.address === activeAddress
      })
      if (addressSnapshot) {
        setAllowlistSignature(addressSnapshot.signature)
        setAllowToVote(true)
      }
    }
  }, [snapshot, activeAddress])

  const handleError = (e: unknown) => {
    if (e instanceof Error) {
      setError(e.message)
    } else {
      // eslint-disable-next-line no-console
      console.error(e)
      setError('Unexpected error')
    }
  }

  const handleSubmitVote = async (selectedOptions: Record<string, string>) => {
    if (!selectedOptions || !activeAddress || !allowlistSignature || !votingRoundMetadata) return
    await submitVote({
      signature: allowlistSignature,
      selectedOptionIndexes: votingRoundMetadata.questions.map((question) =>
        question.options.map((o) => o.id).indexOf(selectedOptions[question.id]),
      ),
      signer: { addr: activeAddress, signer },
      appId: voteId,
    })
    refetchVoteResults(voteId, votingRoundMetadata)
    refetchVotersVote(voteId, activeAddress, votingRoundMetadata, votingRoundGlobalState)
  }

  const handleCloseVotingRound = async () => {
    if (!isVoteCreator || !votingRoundGlobalState || !activeAddress) return
    await closeVotingRound({
      appId: voteId,
      signer: { addr: activeAddress, signer },
    })
    refetchVoteRoundData(voteId)
  }

  return (
    <div className="max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {error && (
          <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
            <Typography>Could not load voting rounds details:</Typography>
            <Typography>{error}</Typography>
          </Alert>
        )}
        <div className="sm:col-span-2">
          {isLoadingVotingRoundData ? (
            <Skeleton className="h-12 w-1/2" variant="text" />
          ) : (
            <Typography variant="h3">{votingRoundMetadata?.title}</Typography>
          )}
          {isLoadingVotingRoundData ? <Skeleton variant="text" /> : <Typography>{votingRoundMetadata?.description}</Typography>}

          <div className="mt-3">
            {isLoadingVotingRoundData ? (
              <Skeleton variant="text" className="w-56" />
            ) : (
              votingRoundMetadata?.informationUrl && (
                <Link href={votingRoundMetadata.informationUrl} target="_blank">
                  Learn more about the vote.
                </Link>
              )
            )}
          </div>
          <VotingTime className="visible sm:hidden mt-4" loading={isLoadingVotingRoundData} globalState={votingRoundGlobalState} />

          {isVoteCreator && !votingRoundGlobalState?.close_time && votingRoundGlobalState?.nft_image_url && (
            <CloseVotingRound
              closingVotingRoundError={closingVotingRoundError}
              loading={closingVotingRound}
              handleCloseVotingRound={handleCloseVotingRound}
              voteEnded={hasVoteEnded}
            />
          )}

          {!hasVoteEnded && (
            <>
              {isLoadingVotingRoundData ? (
                <Stack spacing={1}>
                  <Skeleton variant="text" className="w-1/2" />
                  <Skeleton variant="rectangular" className="h-10" />
                </Stack>
              ) : (
                <>
                  <Typography className="mt-5" variant="h4">
                    How to vote
                  </Typography>
                  <WalletVoteStatus
                    roundMetadata={votingRoundMetadata}
                    activeAddress={activeAddress}
                    hasVoteStarted={hasVoteStarted}
                    hasVoteEnded={hasVoteEnded}
                    allowedToVote={allowedToVote}
                    myVotes={voterVotes}
                  />
                </>
              )}
            </>
          )}
          {!isLoadingVotingRoundData && hasVoteEnded && (
            <div className="mt-5">
              <Typography variant="h4">Vote results</Typography>
              {!!votingRoundGlobalState?.nft_asset_id && (
                <>
                  <Box className="flex h-56 w-56 items-center justify-center border-solid border-black border-y border-x ">
                    <div className="text-center">
                      <Typography>
                        <img
                          src={votingRoundGlobalState.nft_image_url?.replace('ipfs://', `${import.meta.env.VITE_IPFS_GATEWAY_URL}/`)}
                          alt="Voting round result NFT image"
                          className="max-h-full max-w-full"
                        />
                      </Typography>
                    </div>
                  </Box>
                  <Typography>
                    <Link
                      className="font-normal"
                      target="_blank"
                      href={`${import.meta.env.VITE_NFT_EXPLORER_URL}${votingRoundGlobalState?.nft_asset_id}`}
                    >
                      View voting result NFT details
                    </Link>
                  </Typography>
                </>
              )}
            </div>
          )}
          {(isLoadingVotingRoundData || isLoadingResults) && (
            <div className="mt-7">
              <Skeleton className="h-8 w-1/2" variant="text" />
              <Skeleton variant="text" className="w-1/2" />
              <SkeletonArray className="max-w-xs" count={4} />
            </div>
          )}
          <VoteSubmission
            globalState={votingRoundGlobalState}
            roundMetadata={votingRoundMetadata}
            voteResults={votingRoundResults}
            canVote={canVote}
            loadingResults={isLoadingVotingRoundResults}
            loadingVote={isLoadingVotersVote}
            hasVoteStarted={hasVoteStarted}
            hasVoteEnded={hasVoteEnded}
            votingError={errorSubmittingVote}
            existingAnswers={voterVotes}
            handleSubmitVote={handleSubmitVote}
          />
        </div>
        <div>
          <VotingTime className="hidden sm:visible" loading={isLoadingVotingRoundData} globalState={votingRoundGlobalState} />
          <VoteDetails
            loading={isLoadingVotingRoundData}
            appId={voteId}
            roundMetadata={votingRoundMetadata}
            globalState={votingRoundGlobalState}
          />
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" note="Please check your wallet for any pending transactions" />
    </div>
  )
}

export default Vote
