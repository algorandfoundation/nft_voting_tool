import SiteHeader from '../components/siteHeader'
import ConnectWallet from '../features/wallet/ConnectWallet'
import ManualWallet from '../features/wallet/ManualWallet'
import { custom } from '@makerx/use-wallet'
import SiteFooter from '../components/siteFooter'
import ScrollToTop from '../shared/router/ScrollToTop'
import { PropsWithChildren } from 'react'
import { useAlgoWallet } from '../utils/useAlgoWalletProvider'

type LayoutProps = PropsWithChildren<unknown>
const SiteContent = ({ children }: LayoutProps) => {
  return <div className="container mx-auto">{children}</div>
}
// TODO: Refactor Root.tsx to be reusable
export default function RootPreview({ children }: PropsWithChildren) {
  const walletProviders = useAlgoWallet({
    nodeToken: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN,
    nodeServer: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
    nodePort: import.meta.env.VITE_ALGOD_NODE_CONFIG_PORT,
    network: import.meta.env.VITE_ALGOD_NETWORK,
    autoConnect: true,
  })
  return (
    <>
      <SiteHeader />
      <SiteContent>
        <div className="min-h-screen py-8 px-8">{children}</div>
      </SiteContent>
      <ConnectWallet />
      <ManualWallet
        manualWalletClient={
          walletProviders.walletProviders && walletProviders.walletProviders.custom
            ? (walletProviders.walletProviders.custom as custom)
            : undefined
        }
      />
      <SiteFooter />
      <ScrollToTop />
    </>
  )
}
