import { AlgodClientOptions } from "@txnlab/use-wallet";
import { useEffect, useState } from "react";

/*type SupportedProviders = Partial<{
  kmd: Promise<WalletClient | null>
  pera: Promise<WalletClient | null>
  myalgo: Promise<WalletClient | null>
  algosigner: Promise<WalletClient | null>
  defly: Promise<WalletClient | null>
  exodus: Promise<WalletClient | null>
  walletconnect: Promise<WalletClient | null>
}>*/

export function useAlgoWallet(context: { autoConnect: boolean; network?: string; algodConfig?: AlgodClientOptions }) {
  const [walletProviders, setWalletProviders] = useState<any>({});

  useEffect(() => {
    (async () => {
      const algosdk = (await import("algosdk")).default;
      const { defly, exodus, pera, reconnectProviders, walletconnect } = await import("@txnlab/use-wallet");
      const WalletConnect = (await import("@walletconnect/client")).default;
      const QRCodeModal = (await import("algorand-walletconnect-qrcode-modal")).default;

      const providers = {
        pera: pera.init({
          algosdkStatic: algosdk,
          algodOptions: context.algodConfig,
          clientStatic: (await import("@perawallet/connect")).default.PeraWalletConnect,
          network: context.network,
        }),
        defly: defly.init({
          algosdkStatic: algosdk,
          algodOptions: context.algodConfig,
          clientStatic: (await import("@blockshake/defly-connect")).default.DeflyWalletConnect,
          network: context.network,
        }),
        exodus: exodus.init({
          algosdkStatic: algosdk,
          algodOptions: context.algodConfig,
          network: context.network,
        }),
        walletconnect: walletconnect.init({
          algosdkStatic: algosdk,
          clientStatic: WalletConnect,
          algodOptions: context.algodConfig,
          modalStatic: QRCodeModal,
          network: context.network,
        }),
      };
      setWalletProviders(providers);
      if (context.autoConnect) {
        await reconnectProviders(providers);
      }
    })();
  }, []);

  return {
    walletProviders,
  };
}
