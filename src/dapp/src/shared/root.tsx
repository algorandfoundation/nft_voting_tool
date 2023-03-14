import { WalletProvider } from "@txnlab/use-wallet";
import { Outlet } from "react-router-dom";
import { useAlgoWallet } from "../utils/useAlgoWalletProvider";

export default function Root() {
  const walletProviders = useAlgoWallet({
    nodeToken: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN,
    nodeServer: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
    nodePort: import.meta.env.VITE_ALGOD_NOTE_CONFIG_PORT,
    network: import.meta.env.VITE_ALGOD_NETWORK,
    autoConnect: true,
  });

  return (
    <div className="mt-16">
      <WalletProvider value={walletProviders.walletProviders}>
        <Outlet />
      </WalletProvider>
    </div>
  );
}
