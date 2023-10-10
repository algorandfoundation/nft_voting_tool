import '../src/main.css'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import { lightTheme, darkTheme } from '../src/themes'
import type { Preview } from '@storybook/react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { WalletProvider} from '@makerx/use-wallet'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { useAlgoWallet } from '../src/utils/useAlgoWalletProvider'
import { RecoilRoot } from 'recoil'
import { ComponentType } from 'react'


const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  }
}

// TODO: Create Providers.tsx
export const decorators = [
  (Story: ComponentType) => {
    const walletProviders = useAlgoWallet({
      nodeToken: '',
      nodeServer: 'https://testnet-api.algonode.cloud',
      nodePort: '443',
      network: 'testnet',
      autoConnect: true,
    })
    return (
      <div id="root" className="h-fit">
        <RecoilRoot>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <WalletProvider value={walletProviders.walletProviders}>
              <Story />
            </WalletProvider>
          </LocalizationProvider>
        </RecoilRoot>
      </div>
    )
  },
  withThemeFromJSXProvider({
    themes: {
      light: lightTheme(),
      dark: darkTheme(),
    },
    defaultTheme: 'light',
    Provider: ThemeProvider,
    GlobalStyles: CssBaseline,
  })
]
export default preview
