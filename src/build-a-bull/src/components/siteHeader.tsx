import { Disclosure, Popover } from '@headlessui/react'
import { useWallet } from '@makerx/use-wallet'
import { Typography } from '@mui/material'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import algorandFoundationLogo from '../assets/algorand-foundation-logo.svg'
import { useConnectedWallet, useCreatorAddresses, useSetShowConnectWalletModal } from '../features/wallet/state'
import { getWalletLabel } from '../shared/wallet'
import { MenuIcon, XIcon } from './icons'
import { forwardRef } from 'react'

interface Link {
  name: string
  href: string
  target?: string
  subItems?: Link[]
  logo?: string
  protect?: boolean
  onClick?: () => void
}

const createNavigation = () => [{ name: 'Create', href: '/create', protect: true }] as Link[]

function NavLink(props: { currentClasses: string; defaultClasses: string; link: Link; displayName?: string }) {
  const classes = 'no-underline text-black'

  return (
    <>
      {!props.link.href ? (
        <></>
      ) : props.link.href.match(/^https?:\/\//) ? (
        <a href={props.link.href} className={clsx(props.defaultClasses, classes)} target={props.link.target} onClick={props.link.onClick}>
          <Typography>{props.link.name}</Typography>
        </a>
      ) : (
        <Link to={props.link.href} className={clsx(props.defaultClasses, classes)} onClick={props.link.onClick}>
          {props.link.logo && <img src={props.link.logo} height="24px" width="24px" className="mr-1 inline-block" />}
          <Typography className="font-bold">{props.displayName ?? props.link.name}</Typography>
        </Link>
      )}
    </>
  )
}

export default forwardRef<HTMLDivElement>(function SiteHeader(props, ref) {
  const navigation = createNavigation()
  const connectedWallet = useConnectedWallet()
  const setShowConnectedWalletModal = useSetShowConnectWalletModal()
  const showConnectWalletModal = () => setShowConnectedWalletModal(true)
  const walletLabel = connectedWallet ? getWalletLabel(connectedWallet) : 'Connect wallet'
  const { providers } = useWallet()
  const creatorAddresses = useCreatorAddresses()

  const activeProviders = providers ? providers.filter((provider) => provider.isActive === true) : []

  return (
    <Disclosure as="nav">
      {({ open }) => (
        <div className="container mx-auto" ref={ref}>
          {/*Header Content*/}
          <div className="flex justify-between lg:justify-start px-6">
            {/*Site Icon + Name */}
            <div className="py-4 pr-6">
              <Link to="/" className="my-auto cursor-pointer">
                <div className={clsx('flex')}>
                  <img className="h-[73px] w-auto my-auto" src={algorandFoundationLogo} alt="Algorand Foundation logo" />
                </div>
              </Link>
            </div>
            <div className="flex flex-1 justify-between">
              {/* Desktop Header */}
              <div className="hidden lg:flex lg:flex-row lg:justify-between ml-5 flex-auto w-full">
                {/*Site Links*/}
                <Popover.Group as="nav" className="hidden lg:flex gap-[14px] cursor-pointer">
                  {navigation
                    .filter((nl) => nl.name)
                    .filter(
                      (nl) =>
                        !nl.protect ||
                        (connectedWallet && (creatorAddresses.includes(connectedWallet) || creatorAddresses.includes('any'))),
                    )
                    .flatMap((link, index) => {
                      const navLink = (
                        <NavLink
                          key={index}
                          link={link}
                          defaultClasses="inline-flex items-center font-[600] text-l hover:underline"
                          currentClasses="inline-flex items-center font-[600] text-l decoration-orange-600 hover:underline underline-offset-[6px]"
                        />
                      )
                      const pipe = (
                        <div key={`${index}-pipe`} className="inline-flex items-center font-medium text-lg">
                          |
                        </div>
                      )
                      if (index === 0) return [navLink]
                      return [pipe, navLink]
                    })}
                </Popover.Group>

                <div className="flex items-center">
                  <Link
                    className="justify-self-end inline-flex items-center no-underline hover:underline text-black bg-gray-50 h-min rounded-lg p-4"
                    to="#"
                    onClick={showConnectWalletModal}
                  >
                    {activeProviders && activeProviders[0] ? (
                      <img width={30} height={30} className="mr-2" alt="Wallet provider icon" src={activeProviders[0].metadata.icon} />
                    ) : null}
                    <Typography>{walletLabel}</Typography>
                  </Link>
                </div>
              </div>

              <span className="flex-auto block"></span>
              {/* Mobile Menu Open/Close */}
              <div className="lg:hidden -mr-2 flex items-center">
                <Disclosure.Button className="p-2 border-none bg-white cursor-pointer">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>
          {/*Mobile Site Links*/}
          <Disclosure.Panel className="lg:hidden">
            <div className="ml-10 mb-5 pt-2">
              {[...navigation, { name: walletLabel, href: '#', onClick: showConnectWalletModal, protect: false }]
                .filter((nl) => !nl.protect || creatorAddresses.includes(connectedWallet) || creatorAddresses.includes('any'))
                .map((link, index) => (
                  <Disclosure.Button as="span" key={index}>
                    <NavLink
                      link={link}
                      defaultClasses="hover:bg-grey-light hover:border-grey hover:text-black block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                      currentClasses="bg-primary-light border-primary block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                    />
                  </Disclosure.Button>
                ))}
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  )
})
