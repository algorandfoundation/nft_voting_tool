import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import { PeraWalletConnect } from '@perawallet/connect'
import {
  DEFAULT_NETWORK,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT,
  DEFAULT_NODE_TOKEN,
  PROVIDER_ID,
  ProvidersArray,
  useInitializeProviders,
} from '@txnlab/use-wallet'
import { WalletConnectModalSign } from '@walletconnect/modal-sign-html'
import algosdk from 'algosdk'
import { useEffect } from 'react'

export function useAlgoWallet(context: { autoConnect: boolean; network: string; nodeServer: string; nodePort: string; nodeToken: string }) {
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

  useEffect(() => {
    if (context.autoConnect) {
      // reconnectProviders(walletProviders)
    }
  }, [])

  return {
    walletProviders,
  }
}
