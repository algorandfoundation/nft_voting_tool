import { Box, Skeleton, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { getTimezone } from "../../shared/getTimezone";
import { VotingRound } from "../../shared/types";
import { getVoteEnded, getVoteStarted } from "../../shared/vote";

const getVotingStateDescription = (round: VotingRound) => {
  if (getVoteEnded(round)) return "Voting round is closed!";
  if (!getVoteStarted(round)) return "Voting opens soon!";
  return "Voting round is open!";
};

type VotingTimeProps = {
  loading: boolean;
  round: VotingRound | undefined | null;
  className: string;
};

export const VotingTime = ({ loading, round, className }: VotingTimeProps) => (
  <div className={className}>
    <Box className="bg-algorand-diamond rounded-xl p-4 pb-6">
      <div className="text-center">
        {loading || !round ? (
          <Skeleton variant="rectangular" className="h-5 w-3/4 mx-auto" />
        ) : (
          <Typography variant="h5">{getVotingStateDescription(round)}</Typography>
        )}
      </div>
      <Stack className="mt-3">
        <Typography variant="h6">From</Typography>
        {loading ? (
          <Skeleton variant="text" />
        ) : (
          <Typography>
            {dayjs(round?.start).format("D MMMM YYYY HH:mm")} {getTimezone(dayjs(round?.start))}
          </Typography>
        )}
      </Stack>
      <Stack className="mt-3">
        <Typography variant="h6">To</Typography>
        {loading ? (
          <Skeleton variant="text" />
        ) : (
          <Typography>
            {dayjs(round?.end).format("D MMMM YYYY HH:mm")} {getTimezone(dayjs(round?.end))}
          </Typography>
        )}
      </Stack>
    </Box>
  </div>
);
