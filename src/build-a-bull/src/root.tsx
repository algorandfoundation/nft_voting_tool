import { WalletProvider, custom } from '@makerx/use-wallet'
import Box from '@mui/material/Box'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import SiteFooter from './components/siteFooter'
import SiteHeader from './components/siteHeader'
import ConnectWallet from './features/wallet/ConnectWallet'
import ManualWallet from './features/wallet/ManualWallet'
import { useAlgoWallet } from './utils/useAlgoWalletProvider'
import ScrollToTop from './shared/router/ScrollToTop'

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
  const headerRef = useRef<HTMLDivElement | null>(null)
  const heroRef = useRef<Element | null>(null)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const heroHeight = heroRef.current?.clientHeight || heroRef.current?.scrollHeight || 0
    const headerHeight = headerRef.current?.clientHeight || headerRef.current?.scrollHeight || 0
    if (typeof heroHeight === 'number' && typeof headerRef.current?.clientHeight === 'number') {
      setOffset(heroHeight + headerHeight)
    }
  }, [headerRef, heroRef, setOffset])
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <WalletProvider value={walletProviders.walletProviders}>
        <SiteHeader ref={headerRef} />
        <Box component="img" src="/images/hero.png" sx={{ display: 'block', width: '98vw', margin: 'auto' }} ref={heroRef} />
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
        <ScrollToTop offset={offset} />
      </WalletProvider>
    </LocalizationProvider>
  )
}
