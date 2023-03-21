import { createTheme } from "@mui/material";

const defaultSansFontFamily = [
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Oxygen",
  "Ubuntu",
  "Cantarell",
  "Fira Sans",
  "Droid Sans",
  "Helvetica Neue",
  "sans-serif",
];

export const theme = createTheme({
  palette: {
    primary: {
      main: "#ed7157",
      contrastText: "#fff",
    },
  },
  typography: {
    fontFamily: ['"Suisse Intl"', ...defaultSansFontFamily].join(","),
  },
});
