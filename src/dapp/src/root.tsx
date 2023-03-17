import { WalletProvider } from "@txnlab/use-wallet";
import { Outlet } from "react-router-dom";
import SiteFooter from "./components/siteFooter";
import SiteHeader from "./components/siteHeader";
import ScrollToTop from "./shared/router/ScrollToTop";
import { useAlgoWallet } from "./utils/useAlgoWalletProvider";

export default function Root() {
  const walletProviders = useAlgoWallet({
    nodeToken: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN,
    nodeServer: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
    nodePort: import.meta.env.VITE_ALGOD_NOTE_CONFIG_PORT,
    network: import.meta.env.VITE_ALGOD_NETWORK,
    autoConnect: true,
  });

  return (
    <>
      <WalletProvider value={walletProviders.walletProviders}>
        <SiteHeader />
        <div className="min-h-screen py-8 px-8">
          <Outlet />
        </div>
        <SiteFooter />
        <ScrollToTop />
      </WalletProvider>
    </>
  );
}
