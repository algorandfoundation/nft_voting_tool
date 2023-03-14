import { DEFAULT_NETWORK, DEFAULT_NODE_BASEURL, DEFAULT_NODE_TOKEN, WalletProvider } from "@txnlab/use-wallet";
import Nav from "../../shared/nav";
import { useAlgoWallet } from "../../utils/useAlgoWalletProvider";

function VoteConfigPage() {
  const walletProviders = useAlgoWallet({
    autoConnect: true,
    nodeToken: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN ?? DEFAULT_NODE_TOKEN,
    nodeServer: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER ?? DEFAULT_NODE_BASEURL,
    nodePort: import.meta.env.VITE_ALGOD_NOTE_CONFIG_PORT ?? DEFAULT_NODE_TOKEN,
    network: import.meta.env.VITE_ALGOD_NETWORK ?? DEFAULT_NETWORK,
  });
  return (
    <WalletProvider value={walletProviders.walletProviders}>
      <Nav></Nav>
    </WalletProvider>
  );
}

export default VoteConfigPage;
