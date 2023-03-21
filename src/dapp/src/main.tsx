import { CssBaseline, ThemeProvider } from "@mui/material";
import { StyledEngineProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RecoilRoot } from "recoil";
import ErrorPage from "./error-page";
import VotingRounds from "./features/rounds";
import HomePage from "./features/vote";
import Questions from "./features/vote-creation/Questions";
import Review from "./features/vote-creation/review";
import RoundInfo from "./features/vote-creation/RoundInfo";
import CastVote from "./features/vote/cast";
import "./main.css";
import Root from "./root";
import { theme } from "./theme";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <HomePage />,
      },
      {
        path: "create",
        children: [
          {
            path: "",
            element: <RoundInfo />,
          },
          {
            path: "questions",
            element: <Questions />,
          },
          {
            path: "review",
            element: <Review />,
          },
        ],
      },
      {
        path: "cast/:voteCid",
        element: <CastVote />,
      },
      {
        path: "rounds",
        element: <VotingRounds />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <StyledEngineProvider>
      <ThemeProvider theme={theme}>
        <RecoilRoot>
          <RouterProvider router={router} />
        </RecoilRoot>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
