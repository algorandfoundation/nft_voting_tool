import { DEFAULT_NETWORK, DEFAULT_NODE_BASEURL, DEFAULT_NODE_TOKEN, WalletProvider } from "@txnlab/use-wallet";
import { Outlet } from "react-router-dom";
import { useAlgoWallet } from "../utils/useAlgoWalletProvider";

export default function Root() {
  const walletProviders = useAlgoWallet({
    nodeToken: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN ?? DEFAULT_NODE_TOKEN,
    nodeServer: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER ?? DEFAULT_NODE_BASEURL,
    nodePort: import.meta.env.VITE_ALGOD_NOTE_CONFIG_PORT ?? DEFAULT_NODE_TOKEN,
    network: import.meta.env.VITE_ALGOD_NETWORK ?? DEFAULT_NETWORK,
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
