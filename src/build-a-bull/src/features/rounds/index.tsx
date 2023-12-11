import { useWallet } from '@makerx/use-wallet'
import { Alert, Button, Skeleton, Typography } from '@mui/material'
import sortBy from 'lodash.sortby'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { VotingRoundGlobalState, fetchVotingRoundGlobalStatesByCreators } from '@/shared/VotingRoundContract'
import { VoteType } from '@/shared/types'
import { getHasVoteEnded, getHasVoteStarted } from '@/shared/vote'
import { useCreatorAddresses } from '@/features/wallet/state'
import { VotingRoundSection } from './VotingRoundSection'
import { VotingRoundStatus } from './VotingRoundTile'

export const VotingRoundTileLoading = () => (
  <>
    <Skeleton className="h-52" variant="rectangular" />
  </>
)

const getRounds = (
  rounds: VotingRoundGlobalState[],
  filterPredicate: (r: VotingRoundGlobalState) => boolean,
  sortPredicate: Parameters<typeof sortBy>[1],
): VotingRoundGlobalState[] => {
  const filtered = rounds.filter(filterPredicate)
  const sorted = sortBy(filtered, sortPredicate)
  return sorted
}

const VotingRounds = () => {
  const { activeAddress } = useWallet()
  const creatorAddresses = useCreatorAddresses()
  const showMyRounds = creatorAddresses.length == 0 || creatorAddresses.includes('any')
  const isCreator = activeAddress && (creatorAddresses.includes(activeAddress) || creatorAddresses.includes('any'))

  const [globalStates, setGlobalStates] = useState<VotingRoundGlobalState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to live round
  const navigate = useNavigate()
  useEffect(() => {
    // TODO: add production voting round
    const appId = import.meta.env.VITE_ALGOD_NETWORK === 'testnet' ? 499163907 : undefined
    if (import.meta.env.VITE_ENVIRONMENT !== 'local' && typeof appId === 'number') {
      navigate(`/vote/${appId}`)
    }
  }, [])

  useEffect(() => {
    let addressesToFetch = [] as string[]
    if (showMyRounds && activeAddress) {
      addressesToFetch = [activeAddress]
    } else if (!showMyRounds) {
      addressesToFetch = creatorAddresses
    }

    if (addressesToFetch && addressesToFetch.length) {
      ;(async () => {
        setError(null)
        setIsLoading(true)
        try {
          setGlobalStates(await fetchVotingRoundGlobalStatesByCreators(addressesToFetch))
          setIsLoading(false)
        } catch (e) {
          setIsLoading(false)
          if (e instanceof Error) {
            setError(e.message)
          } else {
            // eslint-disable-next-line no-console
            console.error(e)
            setError('Unexpected error')
          }
        }
      })()
    } else {
      setIsLoading(false)
      setGlobalStates([])
    }
  }, [activeAddress, creatorAddresses, showMyRounds])

  const openRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteStarted(r) && !getHasVoteEnded(r) && r.vote_type == VoteType.NO_SNAPSHOT,
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []

  const upcomingRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => !getHasVoteStarted(r) && !getHasVoteEnded(r) && r.vote_type == VoteType.NO_SNAPSHOT,
        (r: VotingRoundGlobalState) => r.start_time,
      )
    : []

  const closedRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteEnded(r) && r.vote_type == VoteType.NO_SNAPSHOT,
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []

  return (
    <div className="container">
      <Typography variant="h3">Events</Typography>

      {isCreator && (
        <Button component={Link} to="/create" className="my-8" variant="contained">
          Create new voting round
        </Button>
      )}

      {error && (
        <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
          <Typography>Could not load voting rounds:</Typography>
          <Typography>{error}</Typography>
        </Alert>
      )}

      <VotingRoundSection label="Open" globalStates={openRounds} votingRoundStatus={VotingRoundStatus.OPEN} loading={isLoading} />
      <VotingRoundSection
        label="Opening soon"
        globalStates={upcomingRounds}
        votingRoundStatus={VotingRoundStatus.OPENING_SOON}
        loading={isLoading}
      />
      <VotingRoundSection label="Closed" globalStates={closedRounds} votingRoundStatus={VotingRoundStatus.CLOSED} loading={isLoading} />
    </div>
  )
}

export default VotingRounds
