import { Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../shared/api";
import { LoadingDialog } from "../vote-creation/review/LoadingDialog";

const ConnectWallet = () => {
  const navigate = useNavigate();
  const { loading, execute: connectWallet } = api.useConnectWallet();

  const selectWallet = async (address: string) => {
    try {
      await connectWallet(address);
      navigate("/");
    } catch (e) {
      // TODO: handle failure
    }
  };

  if (loading) {
    return <LoadingDialog loading={true} title="Connecting wallet..." />;
  }

  return (
    <div className="max-w-2xl">
      <Typography variant="h3">Select a wallet</Typography>
      <div>
        <Typography>
          Select the wallet that you will use to create and sign the voting round. You can't change wallets once you have started to set up
          the voting round.
        </Typography>
      </div>
      <div className="mt-6">
        <Typography>
          You will need approximately [A100] to create the voting round. Ensure your wallet has this amount before you start.{" "}
        </Typography>
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 justify-items-stretch gap-4">
        <Button onClick={() => selectWallet("PERAG7V9V3SR9ZBTO690MV6I")} className="h-20" variant="outlined" color="primary">
          PERA
        </Button>
        <Button onClick={() => selectWallet("DEFLYDPZOO51XYT6V1PO8I7VM")} className="h-20" variant="outlined" color="primary">
          DEFLY
        </Button>
        <Button onClick={() => selectWallet("EXODUS0109JLI7ZZI1I85TRSPZ")} className="h-20" variant="outlined" color="primary">
          EXODUS
        </Button>
        <Button onClick={() => selectWallet("FOURMIXVO4CL9YG7BKQT71N1")} className="h-20" variant="outlined" color="primary">
          WALLET APP FOUR
        </Button>
        <Button onClick={() => selectWallet("FIVEP11PEX71HCF3N3AOAS7U")} className="h-20" variant="outlined" color="primary">
          WALLET APP FIVE
        </Button>
        <Button onClick={() => selectWallet("SIX7Q1LLIVJMXRT000ORWQD")} className="h-20" variant="outlined" color="primary">
          WALLET APP SIX
        </Button>
      </div>
    </div>
  );
};
export default ConnectWallet;
