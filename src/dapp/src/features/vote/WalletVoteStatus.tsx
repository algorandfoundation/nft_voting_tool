import { Box, Button, Link, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useConnectedWallet } from "../../shared/api";
import { VotingRound } from "../../shared/types";
import { getIsAllowedToVote, getWalletAddresses } from "../../shared/wallet";

type WalletVoteStatusProps = {
  round: VotingRound;
};

export const WalletVoteStatus = ({ round: { start, snapshotFile } }: WalletVoteStatusProps) => {
  const walletAddress = useConnectedWallet();
  const allowedToVote = getIsAllowedToVote(walletAddress, getWalletAddresses(snapshotFile));
  return (
    <>
      {getWalletAddresses(snapshotFile).length ? (
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
        <Button href="/connect-wallet" variant="contained" disabled={dayjs(start) > dayjs()}>
          Connect wallet to vote
        </Button>
      )}
      {walletAddress && !allowedToVote && (
        <Box className="bg-algorand-warning text-center p-3 rounded-xl">
          <Typography className="font-semibold text-grey-dark">Your wallet is not on the allow list for this voting round</Typography>
        </Box>
      )}
    </>
  );
};
