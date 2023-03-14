import { PROVIDER_ID, initializeProviders, reconnectProviders } from "@txnlab/use-wallet";
import { useEffect } from "react";

/*type SupportedProviders = Partial<{
  kmd: Promise<WalletClient | null>
  pera: Promise<WalletClient | null>
  myalgo: Promise<WalletClient | null>
  algosigner: Promise<WalletClient | null>
  defly: Promise<WalletClient | null>
  exodus: Promise<WalletClient | null>
  walletconnect: Promise<WalletClient | null>
}>*/

export function useAlgoWallet(context: { autoConnect: boolean; network: string; nodeServer: string; nodePort: string; nodeToken: string }) {
  const walletProviders = initializeProviders(
    [PROVIDER_ID.PERA, PROVIDER_ID.DEFLY, PROVIDER_ID.WALLETCONNECT, PROVIDER_ID.MNEMONIC, PROVIDER_ID.KMD],
    {
      network: context.network,
      nodeServer: context.nodeServer,
      nodePort: context.nodePort,
      nodeToken: context.nodeToken,
    }
  );

  useEffect(() => {
    if (context.autoConnect) {
      reconnectProviders(walletProviders);
    }
  }, []);

  return {
    walletProviders,
  };
}
