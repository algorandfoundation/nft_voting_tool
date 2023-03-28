import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { WalletProvider } from '@txnlab/use-wallet'
import { PropsWithChildren } from 'react'
import { Outlet } from 'react-router-dom'
import SiteFooter from './components/siteFooter'
import SiteHeader from './components/siteHeader'
import ConnectWallet from './features/wallet/ConnectWallet'
import ScrollToTop from './shared/router/ScrollToTop'
import { useAlgoWallet } from './utils/useAlgoWalletProvider'

type LayoutProps = PropsWithChildren<unknown>

const SiteContent = ({ children }: LayoutProps) => {
  return <div className="container mx-auto">{children}</div>
}

export default function Root() {
  const walletProviders = useAlgoWallet({
    nodeToken: import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN,
    nodeServer: import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
    nodePort: import.meta.env.VITE_ALGOD_NODE_CONFIG_PORT,
    network: import.meta.env.VITE_ALGOD_NETWORK,
    autoConnect: true,
  })

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <WalletProvider value={walletProviders.walletProviders}>
        <SiteHeader />
        <SiteContent>
          <div className="min-h-screen py-8 px-8">
            <Outlet />
          </div>
        </SiteContent>
        <ConnectWallet />
        <SiteFooter />
        <ScrollToTop />
      </WalletProvider>
    </LocalizationProvider>
  )
}
