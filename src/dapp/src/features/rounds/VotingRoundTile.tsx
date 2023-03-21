import { Typography } from "@mui/material";
import dayjs from "dayjs";
import { VotingRound } from "../../shared/types";

type VotingRoundTileProps = {
  round: VotingRound;
};
export const VotingRoundTile = ({ round }: VotingRoundTileProps) => {
  return (
    <div className="container border-solid border-2 border-slate-800 p-2">
      <div className="text-center pt-4 pb-12">
        <Typography variant="h6">{round.voteTitle}</Typography>
      </div>
      <div className="flex justify-between">
        <Typography className="text-xs" variant="body1">
          Vote start: {dayjs(round.start).format("LL")}
        </Typography>
        <Typography className="text-xs" variant="body1">
          Vote end: {dayjs(round.end).format("LL")}
        </Typography>
      </div>
    </div>
  );
};
