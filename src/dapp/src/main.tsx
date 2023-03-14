import { ThemeProvider } from "@material-tailwind/react";
import { WalletProvider } from "@txnlab/use-wallet";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ErrorPage from "./error-page";
import VotePage from "./features/vote";
import VoteConfigPage from "./features/vote-config";
import "./main.css";
import Root from "./shared/root";
import { useAlgoWallet } from "./utils/useAlgoWalletProvider";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <VotePage />,
      },
      {
        path: "config",
        element: <VoteConfigPage />,
      },
    ],
  },
]);

const walletProviders = useAlgoWallet({
  autoConnect: true,
  algodConfig: [
    import.meta.env.VITE_ALGOD_NODE_CONFIG_TOKEN ?? "",
    import.meta.env.VITE_ALGOD_NODE_CONFIG_SERVER,
    import.meta.env.VITE_ALGOD_NOTE_CONFIG_PORT,
  ],
  network: import.meta.env.VITE_ALGOD_NETWORK,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <WalletProvider value={walletProviders.walletProviders}>
        <RouterProvider router={router} />
      </WalletProvider>
    </ThemeProvider>
  </React.StrictMode>
);
