import CircleIcon from "@mui/icons-material/Circle";
import { createTheme, stepLabelClasses } from "@mui/material";
import { grey } from "@mui/material/colors";
import { stepConnectorClasses } from "@mui/material/StepConnector";

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

const StepIcon = () => <CircleIcon />;

export const theme = createTheme({
  palette: {
    primary: {
      main: "#ed7157",
      contrastText: "#fff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ['"Suisse Intl"', ...defaultSansFontFamily].join(","),
    h3: {
      fontSize: 32,
      fontWeight: "bold",
      marginBottom: 18,
    },
    h4: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          fontWeight: "bold",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          minWidth: 128,
        },
      },
    },
    MuiStepLabel: {
      defaultProps: {
        StepIconComponent: StepIcon,
      },
      styleOverrides: {
        label: {
          fontSize: 16,
        },
        iconContainer: ({ theme }) => ({
          color: grey[400],
          [`&.${stepLabelClasses.active}`]: {
            color: theme.palette.primary.main,
          },
          [`&.${stepLabelClasses.completed}`]: {
            color: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        root: ({ theme }) => ({
          left: "calc(-50%)",
          right: "calc(50%)",
          top: 9,
          zIndex: -1,
          [`&.${stepConnectorClasses.active}`]: {
            [`& .${stepConnectorClasses.line}`]: {
              borderColor: theme.palette.primary.main,
            },
          },
          [`&.${stepConnectorClasses.completed}`]: {
            [`& .${stepConnectorClasses.line}`]: {
              borderColor: theme.palette.primary.main,
            },
          },
        }),
        line: {
          borderTopWidth: 6,
        },
      },
    },
  },
});
