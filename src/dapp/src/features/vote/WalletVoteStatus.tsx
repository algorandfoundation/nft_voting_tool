import { Button, Link, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useConnectedWallet } from "../../shared/api";
import { VotingRound } from "../../shared/types";
import { getWalletAddresses } from "../../shared/wallet";

type WalletVoteStatusProps = {
  round: VotingRound;
};

export const WalletVoteStatus = ({ round: { start, snapshotFile } }: WalletVoteStatusProps) => {
  const walletAddress = useConnectedWallet();
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
        <Button variant="contained" disabled={dayjs(start) > dayjs()}>
          Connect wallet to vote
        </Button>
      )}
    </>
  );
};
