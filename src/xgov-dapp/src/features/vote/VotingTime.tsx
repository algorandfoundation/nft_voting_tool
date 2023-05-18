import WatchLaterIcon from '@mui/icons-material/WatchLater'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { getHasVoteEnded, getHasVoteStarted } from '../../shared/vote'

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

export const VotingTime = ({ loading, globalState, className }: VotingTimeProps) => {
  const hasVoteStarted = globalState && getHasVoteStarted(globalState)
  const hasVoteEnded = globalState && getHasVoteEnded(globalState)
  const hasVoteClosed = globalState && globalState.close_time

  return (
    <div className={className}>
      <Box className="bg-purple-light flex rounded-xl px-4 py-6">
        <div>
          <WatchLaterIcon className="mr-2 text-purple" />
        </div>
        <div className="w-full">
          <Stack>
            <Typography>
              <strong>Session Period</strong>
            </Typography>
          </Stack>
          <Stack className="mt-3">
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              <Typography>
                {hasVoteStarted ? 'Opened' : 'Voting opens'}{' '}
                <span className={hasVoteStarted ? '' : 'text-red'}>
                  <strong>{`${dayjs(globalState?.start_time).fromNow()} (${dayjs(globalState?.start_time).format(
                    'D MMMM YYYY HH:mm',
                  )})`}</strong>
                </span>
              </Typography>
            )}
          </Stack>
          {hasVoteClosed ? (
            <Stack className="mt-3">
              {loading ? (
                <Skeleton variant="text" />
              ) : (
                <Typography>
                  Closed{' '}
                  <span>
                    <strong>{`${dayjs(globalState?.close_time).fromNow()} (${dayjs(globalState?.close_time).format(
                      'D MMMM YYYY HH:mm',
                    )})`}</strong>
                  </span>
                </Typography>
              )}
            </Stack>
          ) : (
            <Stack className="mt-3">
              {loading ? (
                <Skeleton variant="text" />
              ) : (
                <Typography>
                  {hasVoteEnded ? 'Voting closed' : 'Voting closes'}{' '}
                  <span className={hasVoteStarted && !hasVoteEnded ? 'text-red' : ''}>
                    <strong>{`${dayjs(globalState?.end_time).fromNow()} (${dayjs(globalState?.end_time).format(
                      'D MMMM YYYY HH:mm',
                    )})`}</strong>
                  </span>
                </Typography>
              )}
            </Stack>
          )}
        </div>
      </Box>
    </div>
  )
}
