import { Box, Button, Link, Typography } from "@mui/material";
import { useConnectedWallet } from "../../shared/api";
import { VotingRound } from "../../shared/types";
import { getMyVote, getVoteStarted } from "../../shared/vote";
import { getIsAllowedToVote, getWalletAddresses, getWalletLabel } from "../../shared/wallet";

type WalletVoteStatusProps = {
  round: VotingRound;
};

export const WalletVoteStatus = ({ round }: WalletVoteStatusProps) => {
  const walletAddress = useConnectedWallet();
  const allowList = getWalletAddresses(round.snapshotFile);
  const allowedToVote = getIsAllowedToVote(walletAddress, allowList);
  const voteStarted = getVoteStarted(round);
  const myVote = getMyVote(round, walletAddress);
  return (
    <>
      {allowList.length ? (
        <div className="mb-4">
          <Typography>
            This voting round is restricted to wallets on the{" "}
            <Link className="font-normal" href="/">
              allow list
            </Link>
            .
          </Typography>
        </div>
      ) : null}
      {!walletAddress && (
        <Button href="/connect-wallet" variant="contained" disabled={!voteStarted}>
          Connect wallet to vote
        </Button>
      )}
      {walletAddress && !allowedToVote && (
        <Box className="bg-algorand-warning text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Your wallet is not on the allow list for this voting round</Typography>
        </Box>
      )}
      {walletAddress && allowedToVote && !myVote && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Wallet connected: {getWalletLabel(walletAddress)}</Typography>
        </Box>
      )}
      {myVote && (
        <Box className="bg-algorand-green text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">You voted, and chose [{myVote}]</Typography>
        </Box>
      )}
    </>
  );
};
