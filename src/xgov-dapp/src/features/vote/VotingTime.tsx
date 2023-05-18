import WatchLaterIcon from '@mui/icons-material/WatchLater'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { VotingRoundGlobalState } from '../../../../dapp/src/shared/VotingRoundContract'
import { getTimezone } from '../../shared/getTimezone'
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

export const VotingTime = ({ loading, globalState, className }: VotingTimeProps) => (
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
              From{' '}
              <strong>
                {dayjs(globalState?.start_time).format('D MMMM YYYY HH:mm')} {getTimezone(dayjs(globalState?.start_time))}
              </strong>
            </Typography>
          )}
        </Stack>
        {globalState?.close_time ? (
          <Stack className="mt-3">
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              <Typography>
                Closed at{' '}
                <strong>
                  {dayjs(globalState.close_time).format('D MMMM YYYY HH:mm')} {getTimezone(dayjs(globalState.close_time))}
                </strong>
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack className="mt-3">
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              <Typography>
                To{' '}
                <strong>
                  {dayjs(globalState?.end_time).format('D MMMM YYYY HH:mm')} {getTimezone(dayjs(globalState?.end_time))}
                </strong>
              </Typography>
            )}
          </Stack>
        )}
      </div>
    </Box>
  </div>
)
