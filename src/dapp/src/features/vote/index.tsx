import { Box, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useWallet } from "@txnlab/use-wallet";
import { useParams } from "react-router-dom";
import * as uuid from "uuid";
import api from "../../shared/api";
import { LoadingDialog } from "../../shared/loading/LoadingDialog";
import { SkeletonArray } from "../../shared/SkeletonArray";
import { getMyVote, getVoteEnded, getVoteStarted } from "../../shared/vote";
import { getIsAllowedToVote, getWalletAddresses } from "../../shared/wallet";
import { useConnectedWallet } from "../wallet/state";
import { VoteDetails } from "./VoteDetails";
import { VoteResults } from "./VoteResults";
import { VoteSubmission } from "./VoteSubmission";
import { VotingTime } from "./VotingTime";
import { WalletVoteStatus } from "./WalletVoteStatus";

function Vote() {
  const { voteCid } = useParams();
  const { activeAddress, signer } = useWallet();
  const { data, loading, refetch } = api.useVotingRound(voteCid!);
  const walletAddress = useConnectedWallet();
  const { loading: submittingVote, execute: submitVote } = api.useSubmitVote(voteCid!);
  const voteStarted = !data ? false : getVoteStarted(data);
  const voteEnded = !data ? false : getVoteEnded(data);
  const allowedToVote = !data ? false : getIsAllowedToVote(walletAddress, getWalletAddresses(data.snapshotFile));
  const alreadyVoted = !data ? true : getMyVote(data, walletAddress);
  const canVote = voteStarted && !voteEnded && allowedToVote && !alreadyVoted;

  const handleSubmitVote = async (selectedOption: string) => {
    if (!selectedOption || !activeAddress) return;
    try {
      const result = await submitVote({
        activeAddress,
        signature: "XxbdiHICkPAtpyPwgvXoISjtODjWmVFRrQRddftW4OO36EPTwzZoxGknV+stq51+2XgUkd0HCxZhdonfcPJoBQ==",
        selectedOption: uuid.v4(),
        signer,
        appId: 65,
      });
      // await refetch(result.openRounds.find((p) => p.id === voteCid));
    } catch (e) {
      // TODO: handle failure
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          {loading ? <Skeleton className="h-12 w-1/2" variant="text" /> : <Typography variant="h3">{data?.voteTitle}</Typography>}
          {loading ? <Skeleton variant="text" /> : <Typography>{data?.voteDescription}</Typography>}

          <div className="mt-3">
            {loading ? (
              <Skeleton variant="text" className="w-56" />
            ) : (
              <Link href={data?.voteInformationUrl ?? ""}>Learn about the vote and candidates</Link>
            )}
          </div>
          <VotingTime className="visible sm:hidden mt-4" loading={loading} round={data} />
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

          {!loading && voteEnded && (
            <div className="mt-5">
              <Typography variant="h4">Vote results</Typography>
              <Box className="flex h-56 w-56 items-center justify-center border-solid border-black border-y border-x ">
                <div className="text-center">
                  <Typography>Image of NFT with vote results. Link to NFT source</Typography>
                </div>
              </Box>
            </div>
          )}

          <div className="mt-7">
            {loading ? <Skeleton className="h-8 w-1/2" variant="text" /> : <Typography variant="h4">{data?.questionTitle}</Typography>}

            {loading ? <Skeleton variant="text" className="w-1/2" /> : <Typography>{data?.questionDescription}</Typography>}

            <div className="mt-4">
              {loading || !data ? (
                <SkeletonArray className="max-w-xs" count={4} />
              ) : canVote || !voteStarted ? (
                <VoteSubmission round={data} handleSubmitVote={handleSubmitVote} />
              ) : (
                <VoteResults round={data} />
              )}
            </div>
          </div>
        </div>
        <div>
          <VotingTime className="hidden sm:visible" loading={loading} round={data} />
          <VoteDetails loading={loading} round={data} />
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" />
    </div>
  );
}

export default Vote;
