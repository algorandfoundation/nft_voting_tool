import CancelIcon from '@mui/icons-material/Cancel'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import { Alert, Box, Button, InputAdornment, Link, Skeleton, TextField, Typography } from '@mui/material'
import { useWallet } from '@txnlab/use-wallet'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  VoteGatingSnapshot,
  VotingRoundMetadata,
  fetchVotingRoundMetadata,
  fetchVotingSnapshot,
} from '../../../../dapp/src/shared/IPFSGateway'
import {
  TallyCounts,
  VotingRoundGlobalState,
  fetchTallyCounts,
  fetchVoterVotes,
  fetchVotingRoundGlobalState,
} from '../../../../dapp/src/shared/VotingRoundContract'
import { ProposalCard } from '../../shared/ProposalCard'
import api from '../../shared/api'
import { LoadingDialog } from '../../shared/loading/LoadingDialog'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
import { useSetShowConnectWalletModal } from '../wallet/state'
import { CloseVotingRound } from './CloseVotingRound'
import { VoteDetails } from './VoteDetails'
import { VoteResults } from './VoteResults'
import VotingStats from './VotingStats'
import { VotingTime } from './VotingTime'

function Vote() {
  const { voteId: voteIdParam } = useParams()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const voteId = Number(voteIdParam!)
  const { activeAddress, signer } = useWallet()
  const setShowConnectedWalletModal = useSetShowConnectWalletModal()
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
  const [voteWeight, setVoteWeight] = useState<number>(0)
  const [voteAllocationsPercentage, setVoteAllocationsPercentage] = useState<VoteAllocation>({})
  const [voteAllocations, setVoteAllocations] = useState<VoteAllocation>({})

  const { loading: submittingVote, execute: submitVote, error: errorSubmittingVote } = api.useSubmitVote()
  const { loading: closingVotingRound, execute: closeVotingRound, error: closingVotingRoundError } = api.useCloseVotingRound()

  const totalAllocatedPercentage = Object.values(voteAllocationsPercentage).reduce((a, b) => a + b, 0)
  const totalAllocated = Object.values(voteAllocations).reduce((a, b) => a + b, 0)

  const hasVoteStarted = !votingRoundGlobalState ? false : getHasVoteStarted(votingRoundGlobalState)
  const hasVoteEnded = !votingRoundGlobalState ? false : getHasVoteEnded(votingRoundGlobalState)
  const isVoteCreator = votingRoundMetadata?.created.by === activeAddress ? true : false

  const canVote = hasVoteStarted && !hasVoteEnded && allowedToVote
  const hasVoted = voterVotes !== undefined ? true : false
  const hasClosed = votingRoundGlobalState && votingRoundGlobalState.close_time !== undefined ? true : false

  const canSubmitVote =
    canVote &&
    totalAllocatedPercentage >= 100 &&
    // totalAllocated === voteWeight &&
    activeAddress &&
    allowlistSignature &&
    votingRoundMetadata &&
    !hasVoted

  type VoteAllocation = {
    [key: string]: number
  }

  if (voteIdParam && import.meta.env.VITE_HIDDEN_VOTING_ROUND_IDS?.split(',')?.includes(voteIdParam)) {
    navigate('/')
  }

  const updateVoteAllocations = (proposalId: string, amount: number) => {
    const newVoteAllocationsPercentage = { ...voteAllocationsPercentage }
    if (!isFinite(amount)) {
      amount = 0
    }

    if (amount > 100 - totalAllocatedPercentage + voteAllocationsPercentage[proposalId]) {
      amount = 100 - totalAllocatedPercentage + voteAllocationsPercentage[proposalId]
    }

    newVoteAllocationsPercentage[proposalId] = amount
    setVoteAllocations({ ...voteAllocations, [proposalId]: Math.round((amount / 100) * voteWeight) })
    setVoteAllocationsPercentage(newVoteAllocationsPercentage)
  }

  useEffect(() => {
    const newVoteAllocationsPercentage = {} as VoteAllocation
    const newVoteAllocations = {} as VoteAllocation
    votingRoundMetadata?.questions.forEach((question) => {
      newVoteAllocationsPercentage[question.id as keyof VoteAllocation] = 0
      newVoteAllocations[question.id as keyof VoteAllocation] = 0
    })
    setVoteAllocationsPercentage(newVoteAllocationsPercentage)
    setVoteAllocations(newVoteAllocations)
  }, [votingRoundMetadata])

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
        if (addressSnapshot.weight && isFinite(addressSnapshot.weight)) {
          setVoteWeight(addressSnapshot.weight)
        } else {
          setVoteWeight(1)
        }
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

  const handleSubmitVote = async () => {
    if (!canSubmitVote) return

    const sumOfVotes = Object.values(voteAllocations).reduce((a, b) => a + b, 0)
    const difference = voteWeight - sumOfVotes

    const newVoteAllocations = { ...voteAllocations }

    if (difference !== 0) {
      let isAdjusted = false
      if (difference < 0) {
        Object.entries(newVoteAllocations).forEach(([key, value]) => {
          if (value > Math.abs(difference) && !isAdjusted) {
            newVoteAllocations[key] = value - Math.abs(difference)
            isAdjusted = true
          }
        })
      } else {
        Object.entries(newVoteAllocations).forEach(([key, value]) => {
          if (newVoteAllocations[key] > 0 && !isAdjusted) {
            newVoteAllocations[key] = value + difference
            isAdjusted = true
          }
        })
      }
    }

    await submitVote({
      signature: allowlistSignature,
      selectedOptionIndexes: votingRoundMetadata.questions.map(() => 0),
      weighting: voteWeight,
      weightings: votingRoundMetadata.questions.map((question) => (newVoteAllocations[question.id] ? newVoteAllocations[question.id] : 0)),
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

  if (hasClosed && votingRoundGlobalState) {
    return (
      <VoteResults
        votingRoundResults={votingRoundResults}
        votingRoundMetadata={votingRoundMetadata}
        votingRoundGlobalState={votingRoundGlobalState}
        isLoadingVotingRoundResults={isLoadingVotingRoundResults}
        isLoadingVotingRoundData={isLoadingVotingRoundData}
        snapshot={snapshot}
      />
    )
  }

  return (
    <div>
      <div>
        {error && (
          <Alert className="max-w-xl mt-4 text-white bg-red-light font-semibold" icon={false}>
            <Typography>Could not load voting rounds details:</Typography>
            <Typography>{error}</Typography>
          </Alert>
        )}
        {isLoadingVotingRoundData ? (
          <Skeleton className="h-12 w-1/2" variant="text" />
        ) : (
          <Typography variant="h3">{votingRoundMetadata?.title}</Typography>
        )}
        {votingRoundMetadata?.description && <Typography>{votingRoundMetadata.description}</Typography>}
        {votingRoundMetadata?.informationUrl && (
          <div className="mt-3">
            <Link href={votingRoundMetadata.informationUrl} target="_blank">
              Learn more about the vote.
            </Link>
          </div>
        )}
        <VotingTime className="visible sm:hidden mt-4" loading={isLoadingVotingRoundData} globalState={votingRoundGlobalState} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {isLoadingVotingRoundData ? (
                <Skeleton className="h-12 w-1/2" variant="text" />
              ) : (
                <Typography variant="h4">Proposals</Typography>
              )}
            </div>
            <div>
              {canVote && !hasVoted && (
                <>
                  <Typography variant="h4">Your allocations</Typography>
                  <Typography>
                    {totalAllocatedPercentage}% total · {100 - totalAllocatedPercentage}% remaining to allocate
                  </Typography>
                  <Typography>
                    {totalAllocated.toLocaleString()} total · {voteWeight.toLocaleString()} remaining to allocate
                  </Typography>
                </>
              )}
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
              {isLoadingVotingRoundData && (
                <div>
                  <Skeleton className="h-40 mb-4" variant="rectangular" />
                  <Skeleton className="h-40 mb-4" variant="rectangular" />
                  <Skeleton className="h-40" variant="rectangular" />
                </div>
              )}
              {votingRoundMetadata?.questions.map((question, index) => (
                <>
                  <div>
                    {question.metadata && (
                      <ProposalCard
                        title={question.prompt}
                        description={question.description}
                        category={question.metadata.category}
                        focus_area={question.metadata.focus_area}
                        link={question.metadata.link}
                        threshold={question.metadata.threshold}
                        ask={question.metadata.ask}
                        votesTally={votingRoundResults && votingRoundResults[index] ? votingRoundResults[index].count : 0}
                      />
                    )}
                  </div>
                  <div className="flex items-center">
                    {canVote && !hasVoted && (
                      <>
                        <TextField
                          type="number"
                          className="w-32 bg-white"
                          disabled={totalAllocatedPercentage === 100 && !voteAllocationsPercentage[question.id]}
                          InputProps={{
                            inputProps: {
                              max: 100 - totalAllocatedPercentage + voteAllocationsPercentage[question.id],
                              min: 0,
                            },
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          id={question.id}
                          variant="outlined"
                          onChange={(e) => {
                            updateVoteAllocations(question.id, parseFloat(e.target.value))
                          }}
                          value={voteAllocationsPercentage[question.id] ? `${voteAllocationsPercentage[question.id]}` : 0}
                        />
                        <small>&nbsp;&nbsp; ~{voteAllocations[question.id] ? voteAllocations[question.id] : 0} votes</small>
                      </>
                    )}
                  </div>
                </>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 justify-between flex flex-col">
          <div>
            <div className="mb-2">
              <VoteDetails
                loading={isLoadingVotingRoundData}
                appId={voteId}
                globalState={votingRoundGlobalState}
                roundMetadata={votingRoundMetadata}
              />
            </div>

            {!isLoadingVotingRoundData && (!hasVoteStarted || !activeAddress || !allowedToVote) && (
              <div className="mb-4">
                <Box className="bg-red-light flex rounded-xl px-4 py-6">
                  <div>
                    <CancelIcon className="align-bottom mr-4 text-red" />
                  </div>
                  <div className="w-full">
                    {!hasVoteStarted ? (
                      <Typography>
                        This voting session is not yet open. Please wait until the voting session opens to cast votes.
                      </Typography>
                    ) : !activeAddress ? (
                      <div className="flex w-full justify-between">
                        <div>
                          <Typography>You haven’t connected your wallet.</Typography>
                        </div>
                        <div className="float-right">
                          <Link
                            className="no-underline hover:underline text-red"
                            href="#"
                            onClick={() => setShowConnectedWalletModal(true)}
                          >
                            Connect wallet
                          </Link>
                        </div>
                      </div>
                    ) : !allowedToVote ? (
                      <Typography>Your wallet is not on the allow list for this voting round.</Typography>
                    ) : (
                      ''
                    )}
                  </div>
                </Box>
              </div>
            )}
            <VotingTime className="sm:visible" loading={isLoadingVotingRoundData} globalState={votingRoundGlobalState} />
            {canVote && (
              <div className="mt-4">
                <Box className="bg-yellow-light flex rounded-xl px-4 py-6">
                  <div>
                    <FlashOnIcon className="align-bottom mr-4 text-yellow" />
                  </div>
                  <div>
                    <Typography className="mb-3">
                      Your voting power is determined by your current ALGO balance committed to xGov.
                    </Typography>
                    <Typography className="mb-3">
                      For this round, your voting power is <strong>{voteWeight.toLocaleString()} Votes</strong>.
                    </Typography>
                    <Typography>
                      Please distribute <strong>percentages</strong> of your voting power to your selected proposals below, totalling to{' '}
                      <strong>100%</strong>.
                    </Typography>
                    <Typography>
                      <strong>Once you cast your votes, you cannot change them.</strong>
                    </Typography>
                  </div>
                </Box>
              </div>
            )}

            {votingRoundGlobalState && snapshot && (
              <div className="mt-4">
                <VotingStats isLoading={isLoadingVotingRoundData} votingRoundGlobalState={votingRoundGlobalState} snapshot={snapshot} />
              </div>
            )}

            {isVoteCreator && !votingRoundGlobalState?.close_time && votingRoundGlobalState?.nft_image_url && (
              <div className="mb-4">
                <CloseVotingRound
                  closingVotingRoundError={closingVotingRoundError}
                  loading={closingVotingRound}
                  handleCloseVotingRound={handleCloseVotingRound}
                  voteEnded={hasVoteEnded}
                />
              </div>
            )}
          </div>
          <div>
            {canVote && (
              <Box
                className={clsx(
                  'flex items-center justify-between bottom-2 px-4 py-6 rounded-xl',
                  !canSubmitVote ? 'bg-algorand-vote-closed' : 'bg-green-light',
                )}
              >
                <Typography>
                  <ThumbUpIcon className={clsx('align-bottom mr-4', !canSubmitVote ? '' : 'text-green')} />
                  {!hasVoted ? 'Once your allocations total to 100%, you’ll be able to cast your votes!' : "You've already voted!"}
                </Typography>
                <Button onClick={handleSubmitVote} color="primary" variant="contained" className="text-right" disabled={!canSubmitVote}>
                  Submit
                </Button>
              </Box>
            )}
          </div>
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" note="Please check your wallet for any pending transactions" />
    </div>
  )
}

export default Vote
