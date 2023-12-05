import { HandThumbUpIcon } from '@heroicons/react/24/solid'
import { useWallet } from '@makerx/use-wallet'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CancelIcon from '@mui/icons-material/Cancel'
import ClearIcon from '@mui/icons-material/Clear'
import ShuffleOnIcon from '@mui/icons-material/ShuffleOn'
import { Alert, Box, Button, Checkbox, IconButton, InputAdornment, Link, Skeleton, TextField, Typography } from '@mui/material'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Question, VoteGatingSnapshot, VotingRoundMetadata, fetchVotingRoundMetadata, fetchVotingSnapshot } from '@/shared/IPFSGateway'
import {
  TallyCounts,
  VotingRoundGlobalState,
  fetchTallyCounts,
  fetchVoterVotes,
  fetchVotingRoundGlobalState,
} from '@/shared/VotingRoundContract'
import { ProposalCard } from '@/shared/ProposalCard'
import api from '@/shared/api'
import { LoadingDialog } from '@/shared/loading/LoadingDialog'
import { getHasVoteEnded, getHasVoteStarted } from '@/shared/vote'
import { useSetShowConnectWalletModal } from '@/features/wallet/state'
import { CloseVotingRound } from './CloseVotingRound'
import { FilterMenu, SelectedItem } from './FilterMenu'
import { VoteResults } from './VoteResults'
import { VotingInstructions } from './VotingInstructions'
import VotingStats from './VotingStats'
import { VotingTime } from './VotingTime'
import { generateOptionIDsToCountsMapping } from '@/utils/common'

// Fisher-Yates shuffle
Array.prototype.shuffle = function () {
  const arr = structuredClone(this)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

function Vote({ sort: sortProp = 'none' }: { sort?: 'ascending' | 'descending' | 'none' }) {
  const { voteId: voteIdParam } = useParams()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const voteId = Number(voteIdParam!)
  const { activeAddress, signer } = useWallet()
  const setShowConnectedWalletModal = useSetShowConnectWalletModal()
  const navigate = useNavigate()

  const [votingRoundGlobalState, setVotingRoundGlobalState] = useState<VotingRoundGlobalState | undefined>(undefined)
  const [votingRoundMetadata, setVotingRoundMetadata] = useState<VotingRoundMetadata | undefined>(undefined)
  const [votingRoundResults, setVotingRoundResults] = useState<TallyCounts | undefined>(undefined)
  const [optionIdsToCount, setOptionIdsToCount] = useState<{ [optionId: string]: number } | undefined>(undefined)
  const [voterVotes, setVoterVotes] = useState<string[] | undefined>(undefined)

  const [isLoadingVotingRoundData, setIsLoadingVotingRoundData] = useState(true)
  const [isLoadingVotingRoundResults, setIsLoadingVotingRoundResults] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [voteWeight, setVoteWeight] = useState<number>(0)
  const [voteAllocationsPercentage, setVoteAllocationsPercentage] = useState<VoteAllocation>({})
  const [voteAllocations, setVoteAllocations] = useState<VoteAllocation>({})

  const { loading: submittingVote, execute: submitVote, error: errorSubmittingVote } = api.useSubmitVote()
  const { loading: closingVotingRound, execute: closeVotingRound, error: closingVotingRoundError } = api.useCloseVotingRound()

  const totalAllocatedPercentage = Object.values(voteAllocationsPercentage).reduce((a, b) => a + b, 0)

  const hasVoteStarted = !votingRoundGlobalState ? false : getHasVoteStarted(votingRoundGlobalState)
  const hasVoteEnded = !votingRoundGlobalState ? false : getHasVoteEnded(votingRoundGlobalState)
  const isVoteCreator = votingRoundMetadata?.created.by === activeAddress ? true : false

  const canVote = hasVoteStarted && !hasVoteEnded
  const hasVoted = voterVotes !== undefined ? true : false
  const hasClosed = votingRoundGlobalState && votingRoundGlobalState.close_time !== undefined ? true : false

  function getTotalVotes() {
    return votingRoundResults && votingRoundMetadata
      ? votingRoundResults.reduce((c, r) => {
          const isYesOption = votingRoundMetadata.questions.map((q) => q.options[0]).some((el) => el.id === r.optionId)
          return isYesOption ? c + r.count : c
        }, 0)
      : 0
  }
  const totalVotes = useMemo(() => getTotalVotes(), [votingRoundResults, votingRoundMetadata])

  const [voteState, setVoteState] = useState<{ [k: string]: boolean }>({})

  const canSubmitVote = canVote && activeAddress && votingRoundMetadata && !hasVoted

  type VoteAllocation = {
    [key: string]: number
  }

  if (voteIdParam && import.meta.env.VITE_HIDDEN_VOTING_ROUND_IDS?.split(',')?.includes(voteIdParam)) {
    navigate('/')
  }

  const [sort, setSort] = useState<'ascending' | 'descending' | 'none'>(sortProp)

  /**
   * Users Current Filter
   */
  const [filteredItems, setFilteredItems] = useState<SelectedItem[]>([])

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
      try {
        setVoterVotes(await fetchVoterVotes(voteId, walletAddress, votingRoundMetadata, votingRoundGlobalState))
      } catch (e) {
        handleError(e)
      }
    } else {
      setVoterVotes(undefined)
    }
  }

  const refetchVoteResults = async (voteId: number | undefined, votingRoundMetadata: VotingRoundMetadata | undefined) => {
    if (voteId && votingRoundMetadata) {
      setIsLoadingVotingRoundResults(true)
      try {
        const roundResults = await fetchTallyCounts(voteId, votingRoundMetadata)
        setVotingRoundResults(roundResults)
        const optionIDsToCounts = roundResults !== undefined ? generateOptionIDsToCountsMapping(roundResults) : {}
        setOptionIdsToCount(optionIDsToCounts)
        setIsLoadingVotingRoundResults(false)
      } catch (e) {
        setIsLoadingVotingRoundResults(false)
        handleError(e)
      }
    } else {
      setIsLoadingVotingRoundResults(false)
      setVotingRoundResults(undefined)
      setOptionIdsToCount(undefined)
    }
  }

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

    await submitVote({
      signature: '',
      selectedOptionIndexes: votingRoundMetadata.questions.map((q) => {
        // Has been selected and selection is true, otherwise vote No
        return q.id in voteState ? (voteState[q.id] ? 0 : 1) : 1
      }),
      weighting: 0,
      weightings: votingRoundMetadata.questions.map(() => 0),
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

  /**
   * Handle Filter Chip Interactions
   */
  function handleFilterChange(type: string, name: string) {
    const names = filteredItems.map((fa) => fa.name)
    // Remove Filter
    if (names.includes(name)) {
      // Clone the current state to make it mutable
      const clonedItems = [...filteredItems]
      clonedItems.splice(names.indexOf(name), 1)
      setFilteredItems(clonedItems)
    }
    // Add Filter
    else {
      setFilteredItems([...filteredItems, { name, type }])
    }
  }
  function handleClearFilter() {
    setFilteredItems([])
    setSort('none')
  }
  function handleSortToggle() {
    if (sort === 'ascending') {
      setSort('descending')
    } else {
      setSort('ascending')
    }
  }
  /**
   * Filter Questions based on current state
   */
  function filterQuestions(q: Question) {
    if (typeof q?.metadata?.focus_area !== 'string' || typeof q?.metadata?.category !== 'string') {
      throw new TypeError('Invalid metadata')
    }
    const isFocus = (fa: SelectedItem) => q?.metadata && q.metadata.focus_area === fa.name && fa.type === 'focus'
    const isCategory = (fa: SelectedItem) => q?.metadata && q.metadata.category === fa.name && fa.type === 'category'
    return filteredItems.length === 0 || filteredItems.some((fa) => isFocus(fa) || isCategory(fa))
  }

  function sortQuestions(a: Question, b: Question) {
    if (typeof optionIdsToCount === 'undefined') {
      return 0
    }
    const aCount = optionIdsToCount[a.options[0].id]
    const bCount = optionIdsToCount[b.options[0].id]
    if (sort === 'none') return 0
    const isSorted = sort === 'ascending' ? aCount < bCount : aCount > bCount
    return isSorted ? -1 : 1
  }

  function hasPassed(q: Question) {
    const votesTally = optionIdsToCount && optionIdsToCount[q.options[0].id] ? optionIdsToCount[q.options[0].id] : 0
    const percentage = q.metadata?.threshold && q.metadata.threshold > 0 ? Math.min(100, (votesTally / q.metadata.threshold) * 100) : 100
    return percentage >= 100
  }

  // a compare function that sorts passed questions to the bottom
  function pinPassedQuestions(a: Question, b: Question) {
    const isSorted = !hasPassed(a) && hasPassed(b)
    return isSorted ? -1 : 1
  }
  // Randomize questions on metadata change
  const randomQuestions = useMemo<Question[]>(() => {
    if (votingRoundMetadata && Array.isArray(votingRoundMetadata.questions) && votingRoundMetadata.questions.length > 0) {
      return votingRoundMetadata.questions.shuffle()
    } else {
      return []
    }
  }, [votingRoundMetadata])

  if (hasClosed && votingRoundGlobalState) {
    return (
      <VoteResults
        votingRoundResults={votingRoundResults}
        votingRoundMetadata={votingRoundMetadata}
        votingRoundGlobalState={votingRoundGlobalState}
        isLoadingVotingRoundResults={isLoadingVotingRoundResults}
        isLoadingVotingRoundData={isLoadingVotingRoundData}
      />
    )
  }

  return (
    <div>
      <div className="mb-4">
        <RouterLink to="/" className="no-underline text-gray-600 hover:underline">
          <Typography>&#60; Back to events</Typography>
        </RouterLink>
      </div>
      <div>
        {error && (
          <Alert className="max-w-xl mt-4 text-white bg-red font-semibold" icon={false}>
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
        {canVote && (
          <div className="sm:hidden my-4">
            <VotingInstructions voteWeight={voteWeight} />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-2">
              {isLoadingVotingRoundData ? (
                <Skeleton className="h-12 w-1/2" variant="text" />
              ) : (
                <Typography variant="h4">Projects</Typography>
              )}
            </div>
            <div>
              {canVote && !hasVoted && (
                <>
                  <Typography variant="h4">Your allocations</Typography>
                  <Typography>
                    {totalAllocatedPercentage}% total · {100 - totalAllocatedPercentage}% remaining to allocate
                  </Typography>
                </>
              )}
            </div>

            {isLoadingVotingRoundData && (
              <div className="col-span-3">
                <Skeleton className="h-40 mb-4" variant="rectangular" />
                <Skeleton className="h-40 mb-4" variant="rectangular" />
                <Skeleton className="h-40" variant="rectangular" />
              </div>
            )}
            {randomQuestions
              .filter(filterQuestions)
              .sort(sortQuestions)
              .sort(pinPassedQuestions)
              .map((question) => (
                <div key={question.id} className="col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-white rounded-lg">
                  <div className="col-span-2">
                    {question.metadata && (
                      <ProposalCard
                        title={question.prompt}
                        description={question.description}
                        category={question.metadata.category}
                        focus_area={question.metadata.focus_area}
                        link={question.metadata.link}
                        threshold={question.metadata.threshold}
                        ask={question.metadata.ask}
                        votesTally={
                          optionIdsToCount && optionIdsToCount[question.options[0].id] ? optionIdsToCount[question.options[0].id] : 0
                        }
                        totalVotes={totalVotes}
                      />
                    )}
                  </div>
                  <div className="flex items-center col-span-1 bg-gray-100 m-3">
                    {canVote && !hasVoted && (
                      <Checkbox
                        sx={{ margin: 'auto' }}
                        onChange={(e) => {
                          setVoteState({ ...voteState, [question.id]: e.target.checked })
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="col-span-1 justify-between flex flex-col">
          <div className="hidden md:block">
            {!isLoadingVotingRoundData && (
              <div className="mb-2 mt-8 flex justify-end">
                <IconButton onClick={handleSortToggle}>
                  {sort === 'none' && <ShuffleOnIcon />}
                  {sort === 'ascending' && <ArrowUpwardIcon />}
                  {sort === 'descending' && <ArrowDownwardIcon />}
                </IconButton>

                <FilterMenu
                  questions={votingRoundMetadata?.questions}
                  selected={filteredItems}
                  onChange={handleFilterChange}
                  onClear={handleClearFilter}
                />
                <IconButton onClick={handleClearFilter}>
                  <ClearIcon />
                </IconButton>
              </div>
            )}

            {!isLoadingVotingRoundData && (!hasVoteStarted || !activeAddress) && (
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
                    ) : (
                      ''
                    )}
                  </div>
                </Box>
              </div>
            )}
            <div>
              {canVote && (
                <div>
                  <VotingInstructions voteWeight={voteWeight} />
                </div>
              )}

              {votingRoundGlobalState && (
                <div className="mt-4">
                  <VotingStats isLoading={isLoadingVotingRoundData} votingRoundGlobalState={votingRoundGlobalState} />
                </div>
              )}

              {votingRoundGlobalState && (
                <div className="mt-4">
                  <VotingTime className="sm:visible" loading={isLoadingVotingRoundData} globalState={votingRoundGlobalState} />
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
          </div>
          <div>
            {canVote && (
              <Box
                className={clsx(
                  'flex items-center justify-between bottom-2 px-4 py-6 rounded-xl',
                  !canSubmitVote ? 'bg-algorand-vote-closed' : 'bg-green-light',
                )}
              >
                <div className="flex">
                  <div>
                    <HandThumbUpIcon className={clsx('align-bottom h-6 w-6 mr-3', !canSubmitVote ? '' : 'text-green')} />
                  </div>
                  <div>
                    <Typography>
                      {!hasVoted ? 'Once your allocations total to 100%, you’ll be able to cast your votes!' : "You've already voted!"}
                    </Typography>
                  </div>
                </div>
                <Button onClick={handleSubmitVote} color="primary" variant="contained" className="text-right" disabled={!canSubmitVote}>
                  Submit
                </Button>
              </Box>
            )}
            {errorSubmittingVote && (
              <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
                <Typography>Could not cast vote:</Typography>
                <Typography>{errorSubmittingVote}</Typography>
              </Alert>
            )}
          </div>
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" note="Please check your wallet for any pending transactions" />
    </div>
  )
}

export default Vote
