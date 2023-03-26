import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useWallet } from "@txnlab/use-wallet";
import { useEffect, useState } from "react";
import api from "../../shared/api";
import { Loading } from "../../shared/loading/Loading";
import { getWalletLabel } from "../../shared/wallet";
import { useSetShowConnectWalletModal, useShowConnectWalletModal } from "./state";

const ConnectWallet = () => {
  const [connecting, setConnecting] = useState(false);

  const showConnectWalletModal = useShowConnectWalletModal();
  const setShowConnectWalletModal = useSetShowConnectWalletModal();

  const { execute: connectWallet } = api.useConnectWallet();
  const { providers, activeAddress } = useWallet();

  useEffect(() => {
    (async () => {
      await Promise.all((providers ?? []).map(async (p) => p.reconnect()));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setConnecting(true);
      if (activeAddress) {
        await connectWallet(activeAddress);
      }
      setConnecting(false);
    })();
  }, [activeAddress]);

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
              {activeAddress && (
                <Typography>
                  Connected wallet: <strong>{getWalletLabel(activeAddress)}</strong>
                </Typography>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 justify-items-stretch gap-4">
              {providers?.map((provider) => (
                <Button
                  key={`provider-${provider.metadata.id}`}
                  className="p-4"
                  variant="outlined"
                  color="primary"
                  // startIcon={<img width={30} height={30} alt="" src={provider.metadata.icon} className="mr-2 flex-shrink" />}
                  endIcon={provider.isActive ? <CheckCircleIcon height={30} width={30} /> : ""}
                  onClick={() => {
                    return provider.isConnected ? provider.setActiveProvider() : provider.connect();
                  }}
                >
                  <img width={30} height={30} alt="" src={provider.metadata.icon} className="mr-2 flex-shrink" />
                  <span className="flex-1">{provider.metadata.name}</span>
                </Button>
              ))}
            </div>
          </Stack>
        )}
      </DialogContent>
      {!connecting && (
        <DialogActions>
          <Button onClick={onClose} className="mr-1">
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
export default ConnectWallet;
