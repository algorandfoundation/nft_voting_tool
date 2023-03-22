import { Box, Button, Link, Skeleton, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import range from "lodash.range";
import { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../shared/api";
import { getTimezone } from "../../shared/getTimezone";
import { getVoteStarted } from "../../shared/vote";
import { getWalletAddresses } from "../../shared/wallet";
import { LoadingDialog } from "../vote-creation/review/LoadingDialog";
import { WalletVoteStatus } from "./WalletVoteStatus";

type SkeletonArrayProps = {
  className: string;
  count: number;
};

const getVotingStateDescription = (start: string) => {
  if (dayjs(start) > dayjs()) return "Voting opens soon!";
  return "Voting round is open!";
};

const SkeletonArray = ({ className, count }: SkeletonArrayProps) => (
  <Stack spacing={1}>
    {range(0, count + 1).map((ix) => (
      <Skeleton key={ix} className={className} variant="rectangular" />
    ))}{" "}
  </Stack>
);

function Vote() {
  const { voteCid } = useParams();
  const { data, loading, refetch } = api.useVotingRound(voteCid!);
  const { loading: submittingVote, execute: submitVote } = api.useSubmitVote(voteCid!);
  const [vote, setVote] = useState<number | null>(null);
  const voteStarted = !data ? false : getVoteStarted(data);

  const handleSubmitVote = async () => {
    if (vote === null || !data) return;
    try {
      const result = await submitVote({ selectedOption: data.answers[vote] });
      await refetch(result.openRounds.find((p) => p.id === voteCid));
    } catch (e) {
      // TODO: handle failure
    }
  };
  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          {loading ? <Skeleton className="h-12 w-1/2" variant="text" /> : <Typography variant="h3">{data?.voteTitle}</Typography>}
          {loading ? <Skeleton variant="text" /> : <Typography>{data?.voteDescription}</Typography>}

          <div className="mt-3">
            {loading ? (
              <Skeleton variant="text" className="w-56" />
            ) : (
              <Link href={data?.voteInformationUrl ?? ""}>Learn about the vote and candidates</Link>
            )}
          </div>
          <Typography className="mt-5" variant="h4">
            How to vote
          </Typography>

          {loading || !data ? (
            <Stack spacing={1}>
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton variant="rectangular" className="h-10" />
            </Stack>
          ) : (
            <WalletVoteStatus round={data} />
          )}

          <div className="mt-7">
            {loading ? <Skeleton className="h-8 w-1/2" variant="text" /> : <Typography variant="h4">{data?.questionTitle}</Typography>}

            {loading ? <Skeleton variant="text" className="w-1/2" /> : <Typography>{data?.questionDescription}</Typography>}

            <div className="mt-4">
              {loading ? (
                <SkeletonArray className="max-w-xs" count={4} />
              ) : (
                <>
                  <Stack spacing={1} className="max-w-xs">
                    {data?.answers.map((answer, ix) => (
                      <Button
                        disabled={!voteStarted}
                        variant={vote === ix ? "contained" : "outlined"}
                        key={ix}
                        onClick={() => setVote(ix)}
                        className="w-full uppercase"
                      >
                        {answer}
                      </Button>
                    ))}
                  </Stack>
                  {voteStarted && (
                    <Button disabled={vote === null} onClick={() => handleSubmitVote()} className="uppercase mt-4" variant="contained">
                      Submit vote
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          <Box className="bg-algorand-diamond rounded-xl p-4">
            <div className="text-center">
              {loading ? (
                <Skeleton variant="rectangular" className="h-5 w-3/4 mx-auto" />
              ) : (
                <Typography variant="h5">{getVotingStateDescription(data?.start ?? "")}</Typography>
              )}
            </div>
            <Stack className="mt-3">
              <Typography variant="h6">From</Typography>
              {loading ? (
                <Skeleton variant="text" />
              ) : (
                <Typography>
                  {dayjs(data?.start).format("D MMMM YYYY HH:mm")} {getTimezone(dayjs(data?.start))}
                </Typography>
              )}
            </Stack>
            <Stack className="mt-3">
              <Typography variant="h6">To</Typography>
              {loading ? (
                <Skeleton variant="text" />
              ) : (
                <Typography>
                  {dayjs(data?.end).format("D MMMM YYYY HH:mm")} {getTimezone(dayjs(data?.end))}
                </Typography>
              )}
            </Stack>
          </Box>

          <Stack spacing={1}>
            <Typography className="mt-5" variant="h5">
              Vote details
            </Typography>
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              <Typography>
                Voting round created by <Link className="font-normal">NF Domain</Link>
              </Typography>
            )}
            {loading ? <Skeleton variant="text" /> : <Link>Smart contract</Link>}
            {loading ? <Skeleton variant="text" /> : <Link>Voting round details in IPFS</Link>}
            {loading ? <Skeleton variant="text" /> : getWalletAddresses(data?.snapshotFile).length ? <Link>Allow list</Link> : null}
          </Stack>
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" />
    </div>
  );
}

export default Vote;
