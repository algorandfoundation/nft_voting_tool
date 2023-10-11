import { ComponentType, useEffect } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useWallet } from '@makerx/use-wallet'
import Root from './Root'

export type WithRouterOptions = {
  /**
   * Enable routes, ignored when layout === true
   */
  routes?: boolean
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
  /**
   * Override the Manual Wallet Provider
   */
  wallet?: string
  /**
   * Full Layout
   *
   * Includes Router and Main Layout
   */
  layout?: boolean
}

const DEFAULT_OPTIONS = {
  routes: true,
  path: '/',
  entries: ['/'],
  wallet: 'HIETYX6Z242IHPLDCQWI3DVG7DINEHGMOPYEWVUS5CRN7RJRTN5Q4IF2SM',
  layout: false,
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

/**
 *
 * @param Component - composed component
 * @param routes - enable routes, ignored when layout === true
 * @param path
 * @param entries
 * @param wallet
 * @param layout
 */
export function withRoute(
  Component: ComponentType,
  {
    routes = DEFAULT_OPTIONS.routes,
    path = DEFAULT_OPTIONS.path,
    entries = DEFAULT_OPTIONS.entries,
    wallet = DEFAULT_OPTIONS.wallet,
    layout = DEFAULT_OPTIONS.layout,
  }: WithRouterOptions = DEFAULT_OPTIONS,
) {
  return layout
    ? (args) => {
        useStoryWallet(wallet)
        return (
          <MemoryRouter initialEntries={entries}>
            <Routes>
              <Route
                path={path}
                element={
                  <Root>
                    <Component {...args} />
                  </Root>
                }
              />
            </Routes>
          </MemoryRouter>
        )
      }
    : routes
    ? (args) => {
        useStoryWallet(wallet)
        return (
          <MemoryRouter>
            <Routes>
              <Route element={<Component {...args} />} />
            </Routes>
          </MemoryRouter>
        )
      }
    : (args) => {
        useStoryWallet(wallet)
        return (
          <MemoryRouter>
            <Component {...args} />
          </MemoryRouter>
        )
      }
}
