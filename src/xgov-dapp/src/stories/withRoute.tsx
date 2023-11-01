import { ComponentType, PropsWithChildren, ReactNode, useEffect } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useWallet } from '@makerx/use-wallet'
import Root from './Root'

export type RouterOptions = {
  enabled: boolean
  /**
   * React router path
   *
   * Path to match for useParam
   */
  path?: string
  /**
   * Router initial entries
   *
   * Mocks location of the component
   */
  entries?: string[]
}
export type WalletOptions = {
  address?: string
  enabled: boolean
}
export type WithMocksOptions = {
  /**
   * Enable routes, ignored when layout === true
   */
  router?: RouterOptions
  /**
   * Override the Manual Wallet Provider
   */
  wallet?: WalletOptions
  /**
   * Include the Header and Footer
   */
  appShell?: boolean
  /**
   * Child Components Prop
   */
  children?: ReactNode
}

export const DEFAULT_OPTIONS = {
  router: {
    enabled: true,
    path: '/*',
    entries: ['/'],
  },
  wallet: {
    enabled: true,
    address: 'HIETYX6Z242IHPLDCQWI3DVG7DINEHGMOPYEWVUS5CRN7RJRTN5Q4IF2SM',
  },
  appShell: false,
}

function useStoryWallet(wallet: string) {
  const { providers, activeAddress } = useWallet()
  const custom = providers && providers.find((p) => p.metadata.id === 'custom')

  useEffect(() => {
    if (!custom) return
    if (!custom.isConnected) custom.connect()
    if (!activeAddress) return
    if (activeAddress !== wallet) {
      custom.setActiveAccount(wallet)
    }
  }, [activeAddress, custom])

  return wallet
}

type MockProps = {
  options?: WithMocksOptions
} & PropsWithChildren

function WalletWrapper({ options = DEFAULT_OPTIONS, children }: MockProps) {
  if (typeof options?.wallet?.address !== 'string') {
    throw new TypeError('Must have a valid wallet')
  }
  useStoryWallet(options.wallet.address)
  return <Wrapper options={options}>{children}</Wrapper>
}
function Wrapper({ options = DEFAULT_OPTIONS, children }: MockProps) {
  if (options?.appShell) {
    return (
      <MemoryRouter initialEntries={options.router?.entries}>
        <Routes>
          <Route path={options.router?.path} element={<Root>{children}</Root>} />
        </Routes>
      </MemoryRouter>
    )
  }

  if (options?.router?.enabled) {
    return (
      <MemoryRouter initialEntries={options.router.entries}>
        <Routes>
          <Route path={options.router.path} element={children} />
        </Routes>
      </MemoryRouter>
    )
  }

  return <>{children}</>
}

export function withStorybookWrapper<P extends object>(
  Component: ComponentType<P>,
  options: WithMocksOptions = DEFAULT_OPTIONS,
): ComponentType<P> {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    wallet: {
      ...DEFAULT_OPTIONS.wallet,
      ...options.wallet,
    },
  }
  if (opts.wallet.enabled) {
    return (props: P) => (
      <WalletWrapper options={opts}>
        <Component {...props} />
      </WalletWrapper>
    )
  }
  return (props: P) => (
    <Wrapper options={opts}>
      <Component {...props} />
    </Wrapper>
  )
}
/**
 *
 * @param Component
 * @param options
 * @deprecated
 */
export function withRoute<P extends object>(Component: ComponentType<P>, options: WithMocksOptions = DEFAULT_OPTIONS): ComponentType<P> {
  return withStorybookWrapper<P>(Component, options)
}
