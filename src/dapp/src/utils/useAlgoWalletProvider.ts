import { AlgodClientOptions, PROVIDER_ID, defly, kmd, mnemonic, pera, reconnectProviders, walletconnect } from "@txnlab/use-wallet";
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
import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";

export function useAlgoWallet(context: { autoConnect: boolean; network: string; nodeServer: string; nodePort: string; nodeToken: string }) {
  const algodOptions = [context.nodeToken, context.nodeServer, context.nodePort] as AlgodClientOptions;
  const walletProviders = {
    [PROVIDER_ID.PERA]: pera.init({
      algosdkStatic: algosdk,
      clientStatic: PeraWalletConnect,
      algodOptions: algodOptions,
      network: context.network,
    }),
    [PROVIDER_ID.DEFLY]: defly.init({
      algosdkStatic: algosdk,
      clientStatic: DeflyWalletConnect,
      algodOptions: algodOptions,
      network: context.network,
    }),
    [PROVIDER_ID.WALLETCONNECT]: walletconnect.init({
      algosdkStatic: algosdk,
      clientStatic: WalletConnect,
      modalStatic: QRCodeModal,
      algodOptions: algodOptions,
      network: context.network,
    }),
    [PROVIDER_ID.MNEMONIC]: mnemonic.init({
      algosdkStatic: algosdk,
      algodOptions: algodOptions,
      network: context.network,
    }),
    [PROVIDER_ID.KMD]: kmd.init({
      algosdkStatic: algosdk,
      algodOptions: algodOptions,
      network: context.network,
    }),
  };

  useEffect(() => {
    if (context.autoConnect) {
      reconnectProviders(walletProviders);
    }
  }, []);

  return {
    walletProviders,
  };
}
