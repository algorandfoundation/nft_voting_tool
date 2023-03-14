import { ThemeProvider } from "@material-tailwind/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./error-page";
import HomePage from "./features/vote";
import VoteCreationPage from "./features/vote-creation";
import CastVote from "./features/vote/cast";
import "./main.css";
import Root from "./root";

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
        element: <VoteCreationPage />,
      },
      {
        path: "cast/:voteCid",
        element: <CastVote />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
