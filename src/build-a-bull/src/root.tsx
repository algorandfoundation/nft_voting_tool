import { WalletProvider, custom } from '@makerx/use-wallet'
import Box from '@mui/material/Box'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { PropsWithChildren } from 'react'
import { Outlet } from 'react-router-dom'
import SiteFooter from './components/siteFooter'
import SiteHeader from './components/siteHeader'
import ConnectWallet from './features/wallet/ConnectWallet'
import ManualWallet from './features/wallet/ManualWallet'
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
        <Box component="img" src="/images/hero.png" sx={{ width: '99.2vw' }} />
        <SiteContent>
          <div className="min-h-screen py-8 px-8">
            <Outlet />
          </div>
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
      </WalletProvider>
    </LocalizationProvider>
  )
}
