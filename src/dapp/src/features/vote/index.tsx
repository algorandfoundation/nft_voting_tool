import { Box, Button, Link, Skeleton, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import range from "lodash.range";
import { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../shared/api";
import { getTimezone } from "../../shared/getTimezone";
import { getWalletAddresses } from "../../shared/wallet";
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
  const { data, loading } = api.useVotingRound(voteCid!);
  const [vote, setVote] = useState<number | null>(null);

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
          {loading ? (
            <Skeleton variant="text" className="w-1/2" />
          ) : getWalletAddresses(data?.snapshotFile).length ? (
            <Typography>
              This voting round is restricted to wallets on the{" "}
              <Link className="font-normal" href="/">
                allow list
              </Link>
              .
            </Typography>
          ) : null}

          {loading ? <Skeleton variant="rectangular" className="h-10" /> : <WalletVoteStatus />}

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
                      <Button variant={vote === ix ? "contained" : "outlined"} key={ix} onClick={() => setVote(ix)} className="w-full">
                        {answer}
                      </Button>
                    ))}
                  </Stack>
                  <Button disabled={vote === null} className="uppercase mt-4" variant="contained">
                    Submit vote
                  </Button>
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
    </div>
  );
}

export default Vote;
