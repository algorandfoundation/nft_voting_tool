import CircleIcon from '@mui/icons-material/Circle'
import { createTheme, stepLabelClasses } from '@mui/material'
import { grey } from '@mui/material/colors'
import { stepConnectorClasses } from '@mui/material/StepConnector'

const defaultSansFontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Oxygen',
  'Ubuntu',
  'Cantarell',
  'Fira Sans',
  'Droid Sans',
  'Helvetica Neue',
  'sans-serif',
]

const StepIcon = () => <CircleIcon />

export const lightTheme = () =>
  createTheme({
    palette: {
      primary: {
        main: '#00B076',
        contrastText: '#fff',
      },
      success: {
        main: 'rgba(1, 220, 148, 1)',
      },
      error: {
        main: '#FF3A29',
      },
      info: {
        main: '#131DFF',
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: ['"DM Sans"', ...defaultSansFontFamily].join(','),
      h3: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 18,
      },
      h4: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
      },
      h5: {
        fontSize: 20,
      },
      h6: {
        fontSize: 16,
      },
    },
    components: {
      // MuiDialog: {
      //   defaultProps: {
      //     container: rootElement,
      //   },
      // },
      MuiLink: {
        styleOverrides: {
          root: {
            fontWeight: 'bold',
            color: '#231F20',
            textDecorationColor: '#231F20',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            minWidth: 128,
            borderRadius: 10,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
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
            left: 'calc(-50%)',
            right: 'calc(50%)',
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
  })

export const darkTheme = () =>
  createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#00B076',
        contrastText: '#fff',
      },
      success: {
        main: 'rgba(1, 220, 148, 1)',
      },
      error: {
        main: '#FF3A29',
      },
      info: {
        main: '#131DFF',
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: ['"DM Sans"', ...defaultSansFontFamily].join(','),
      h3: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 18,
      },
      h4: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
      },
      h5: {
        fontSize: 20,
      },
      h6: {
        fontSize: 16,
      },
    },
    components: {
      MuiLink: {
        styleOverrides: {
          root: {
            fontWeight: 'bold',
            color: '#231F20',
            textDecorationColor: '#231F20',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            minWidth: 128,
            borderRadius: 10,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
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
            left: 'calc(-50%)',
            right: 'calc(50%)',
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
  })
