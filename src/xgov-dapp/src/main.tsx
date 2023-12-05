import { CssBaseline, ThemeProvider } from '@mui/material'
import { StyledEngineProvider } from '@mui/material/styles'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import ErrorPage from './error-page'
import VotingRounds from './features/rounds'
import Status from './features/status'
import Vote from './features/vote'
import RoundInfo from './features/vote-creation/RoundInfo'
import Review from './features/vote-creation/review'
import ConnectWallet from './features/wallet/ConnectWallet'
import './main.css'
import Root from './root'
import RequireCreator from './shared/router/RequireCreator'
import { theme } from './theme'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <VotingRounds />,
      },
      {
        path: 'create',
        element: <RequireCreator />,
        children: [
          {
            path: '',
            element: <RoundInfo />,
          },
          {
            path: 'review',
            element: <Review />,
          },
        ],
      },
      {
        path: 'vote/:voteId',
        element: <Vote />,
      },
      {
        path: 'connect-wallet',
        element: <ConnectWallet />,
      },
      {
        path: 'status',
        element: <Status />,
      },
    ],
  },
])

const rootElement = document.getElementById('root') as HTMLElement

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
    },
  },
})

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <StyledEngineProvider>
        <ThemeProvider theme={theme(rootElement)}>
          <RecoilRoot>
            <RouterProvider router={router} />
          </RecoilRoot>
        </ThemeProvider>
      </StyledEngineProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
