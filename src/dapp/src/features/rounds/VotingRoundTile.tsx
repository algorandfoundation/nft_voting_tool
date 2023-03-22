import { Card, CardContent, Typography } from "@mui/material";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { VotingRound } from "../../shared/types";

type VotingRoundTileProps = {
  round: VotingRound;
};
export const VotingRoundTile = ({ round }: VotingRoundTileProps) => {
  return (
    <Link className="no-underline" to={`/vote/${round.id}`}>
      <Card className="cursor-pointer" variant="outlined">
        <CardContent>
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
        </CardContent>
      </Card>
    </Link>
  );
};
