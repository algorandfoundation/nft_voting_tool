import { Typography } from "@mui/material";
import { VotingRound } from "../../shared/types";

type VoteResultsProps = {
  round: VotingRound;
};

const values = [200, 561, 302, 482];

export const VoteResults = ({ round }: VoteResultsProps) => {
  const max = Math.max(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const pixelWidth = values.map((v) => (v / max) * 150);
  return (
    <>
      <div className="grid grid-cols-3 w-80 gap-2">
        {round.answers.map((option, ix) => (
          <>
            <div className="col-span-2 h-10 flex items-center">
              <div className="bg-algorand-orange-coral h-10 rounded-tr-xl rounded-br-xl" style={{ flexBasis: `${pixelWidth[ix]}px` }}></div>
              <div className="p-2 pr-6">{values[ix]}</div>
            </div>
            <div className="flex  items-center">{option}</div>
          </>
        ))}
      </div>
      <div className="flex mt-4">
        <Typography className="text-grey">Number of wallets voted</Typography>
        <Typography className="ml-4">{sum.toLocaleString()}</Typography>
      </div>
    </>
  );
};
