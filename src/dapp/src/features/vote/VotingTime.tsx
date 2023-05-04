import { Box, Skeleton, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { getTimezone } from '../../shared/getTimezone'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'
import { VotingRoundGlobalState } from '../../shared/votingRoundContract'

const getVotingStateDescription = (round: VotingRoundGlobalState) => {
  if (getHasVoteEnded(round)) return 'Voting round is closed!'
  if (!getHasVoteStarted(round)) return 'Voting opens soon!'
  return 'Voting round is open!'
}

type VotingTimeProps = {
  loading: boolean
  globalState: VotingRoundGlobalState | undefined | null
  className: string
}

export const VotingTime = ({ loading, globalState, className }: VotingTimeProps) => (
  <div className={className}>
    <Box className="bg-algorand-diamond rounded-xl p-4 pb-6">
      <div className="text-center">
        {loading || !globalState ? (
          <Skeleton variant="rectangular" className="h-5 w-3/4 mx-auto" />
        ) : (
          <Typography variant="h5">{getVotingStateDescription(globalState)}</Typography>
        )}
      </div>
      <Stack className="mt-3">
        <Typography variant="h6">From</Typography>
        {loading ? (
          <Skeleton variant="text" />
        ) : (
          <Typography>
            {dayjs(globalState?.start_time).format('D MMMM YYYY HH:mm')} {getTimezone(dayjs(globalState?.start_time))}
          </Typography>
        )}
      </Stack>
      <Stack className="mt-3">
        <Typography variant="h6">To</Typography>
        {loading ? (
          <Skeleton variant="text" />
        ) : (
          <Typography>
            {dayjs(globalState?.end_time).format('D MMMM YYYY HH:mm')} {getTimezone(dayjs(globalState?.end_time))}
          </Typography>
        )}
      </Stack>
      {!!globalState?.close_time && (
        <Stack className="mt-3">
          <Typography variant="h6">Closed at</Typography>
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <Typography>
              {dayjs(globalState.close_time).format('D MMMM YYYY HH:mm')} {getTimezone(dayjs(globalState.close_time))}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  </div>
)
