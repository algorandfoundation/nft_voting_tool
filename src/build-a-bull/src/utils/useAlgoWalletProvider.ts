import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import {
  DEFAULT_NETWORK,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT,
  DEFAULT_NODE_TOKEN,
  Network,
  PROVIDER_ID,
  ProvidersArray,
  useInitializeProviders,
} from '@makerx/use-wallet'
import MyAlgoConnect from '@randlabs/myalgo-connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { WalletConnectModalSign } from '@walletconnect/modal-sign-html'
import type _algosdk from 'algosdk'
import algosdk from 'algosdk'
import {
  ManualSigningProvider,
  useSetManualWalletPayloadToSign,
  useSetShowManualWalletModal,
} from '../features/wallet/manualSigningProvider'

export function useAlgoWallet(context: { autoConnect: boolean; network: string; nodeServer: string; nodePort: string; nodeToken: string }) {
  const setManualWalletModal = useSetShowManualWalletModal()
  const setManualWalletPayloadToSign = useSetManualWalletPayloadToSign()

  const providers = [
    { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
    { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
    { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
    {
      id: PROVIDER_ID.WALLETCONNECT,
      clientStatic: WalletConnectModalSign,
      clientOptions: {
        projectId: 'ce0484235bcb9e2c431489a5ed84dac7',
        metadata: {
          name: 'xGov Dapp',
          description: 'xGov Dapp',
          url: '#',
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
        modalOptions: {
          themeVariables: {
            '--wcm-z-index': '9999',
          },
        },
      },
    },
    {
      id: PROVIDER_ID.CUSTOM,
      clientOptions: {
        name: 'Manual',
        getProvider: (params: { network?: Network; algod?: algosdk.Algodv2; algosdkStatic?: typeof _algosdk }) => {
          return new ManualSigningProvider(params.algosdkStatic ?? algosdk, setManualWalletModal, setManualWalletPayloadToSign)
        },
      },
    },
    { id: PROVIDER_ID.MYALGO, clientStatic: MyAlgoConnect },
    { id: PROVIDER_ID.EXODUS },
  ] as ProvidersArray

  if (import.meta.env.VITE_ENVIRONMENT === 'local') {
    providers.push({ id: PROVIDER_ID.KMD })
  }

  const walletProviders = useInitializeProviders({
    providers: providers,
    algosdkStatic: algosdk,
    nodeConfig: {
      network: context.network ?? DEFAULT_NETWORK,
      nodeToken: context.nodeToken ?? DEFAULT_NODE_TOKEN,
      nodeServer: context.nodeServer ?? DEFAULT_NODE_BASEURL,
      nodePort: context.nodePort ?? DEFAULT_NODE_PORT,
    },
  })

  return {
    walletProviders,
  }
}
