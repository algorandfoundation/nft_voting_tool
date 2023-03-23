import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useState } from "react";
import api from "../../shared/api";
import { Loading } from "../../shared/loading/Loading";
import { useSetShowConnectWalletModal, useShowConnectWalletModal } from "./state";

const ConnectWallet = () => {
  const { execute: connectWallet } = api.useConnectWallet();
  const [connecting, setConnecting] = useState(false);

  const showConnectWalletModal = useShowConnectWalletModal();
  const setShowConnectWalletModal = useSetShowConnectWalletModal();

  const selectWallet = async (address: string) => {
    try {
      setConnecting(true);
      await connectWallet(address);
      setShowConnectWalletModal(false);
      setTimeout(() => {
        setConnecting(false);
      }, 100);
    } catch (e) {
      // TODO: handle failure
    }
  };

  const onClose = () => {
    setShowConnectWalletModal(false);
  };

  return (
    <Dialog open={showConnectWalletModal} onClose={onClose}>
      <DialogTitle>{connecting ? "Connecting wallet... " : "Select a wallet"}</DialogTitle>
      <DialogContent>
        {connecting ? (
          <Loading />
        ) : (
          <Stack spacing={2}>
            <div>
              <Typography>
                Select the wallet that you will use to create and sign the voting round. You can't change wallets once you have started to
                set up the voting round.
              </Typography>
            </div>
            <div>
              <Typography>
                You will need approximately [A100] to create the voting round. Ensure your wallet has this amount before you start.{" "}
              </Typography>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 justify-items-stretch gap-4">
              <Button onClick={() => selectWallet("PERAG7V9V3SR9ZBTO690MV6I")} className="h-30" variant="outlined" color="primary">
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
          </Stack>
        )}
      </DialogContent>
      {!connecting && (
        <DialogActions>
          <Button onClick={onClose} className="mr-1">
            Cancel
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
export default ConnectWallet;
