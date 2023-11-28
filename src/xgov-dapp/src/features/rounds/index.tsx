import { useWallet } from '@makerx/use-wallet'
import LaunchIcon from '@mui/icons-material/Launch'
import { Alert, Box, Button, Skeleton, Typography, Link as MuiLink } from '@mui/material'
import sortBy from 'lodash.sortby'
import { Link } from 'react-router-dom'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { VoteType } from '../../shared/types'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
import { useCreatorAddresses } from '../wallet/state'
import { VotingRoundSection } from './VotingRoundSection'
import { VotingRoundStatus } from './VotingRoundTile'
import useGlobalStatesByCreatorQuery from '../../hooks/use-global-states-by-creator-query'

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
  return sortBy(filtered, sortPredicate)
}

const VotingRoundsPage = () => {
  const { activeAddress } = useWallet()
  const creatorAddresses = useCreatorAddresses()
  const showMyRounds = creatorAddresses.length == 0 || creatorAddresses.includes('any')
  const isCreator = activeAddress && (creatorAddresses.includes(activeAddress) || creatorAddresses.includes('any'))

  let addressesToFetch = [] as string[]
  if (showMyRounds && activeAddress) {
    addressesToFetch = [activeAddress]
  } else if (!showMyRounds) {
    addressesToFetch = creatorAddresses
  }

  const { data: globalStates, isLoading, isError, error } = useGlobalStatesByCreatorQuery(addressesToFetch)

  const openRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteStarted(r) && !getHasVoteEnded(r) && r.vote_type == VoteType.PARTITIONED_WEIGHTING,
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []

  const upcomingRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => !getHasVoteStarted(r) && !getHasVoteEnded(r) && r.vote_type == VoteType.PARTITIONED_WEIGHTING,
        (r: VotingRoundGlobalState) => r.start_time,
      )
    : []

  const closedRounds = globalStates
    ? getRounds(
        globalStates,
        (r) => getHasVoteEnded(r) && r.vote_type == VoteType.PARTITIONED_WEIGHTING,
        (r: VotingRoundGlobalState) => r.end_time,
      )
    : []

  return (
    <div className="container">
      <div className="flex flex-col items-end">
        <Box className="bg-white flex rounded-xl px-4 py-2 items-center">
          <MuiLink className="no-underline hover:underline" href="https://www.algorand.foundation/xgov-guide" target="_blank">
            xGov Guide
            <LaunchIcon className="ml-2 text-grey-light align-bottom" />
          </MuiLink>
        </Box>
      </div>
      <Typography variant="h3">Voting sessions</Typography>

      {isCreator && (
        <Button component={Link} to="/create" className="my-8" variant="contained">
          Create new voting round
        </Button>
      )}

      {isError && (
        <Alert className="max-w-xl mt-4 text-white bg-red-600 font-semibold" icon={false}>
          <Typography>Could not load voting rounds:</Typography>
          <Typography>{(error as Error).message}</Typography>
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

export default VotingRoundsPage
