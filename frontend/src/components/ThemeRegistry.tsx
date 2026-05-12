"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  typography: {
    fontFamily: "\"Plus Jakarta Sans\", Arial, sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 800
    }
  },
  palette: {
    primary: {
      main: "#08133b",
      dark: "#050b24"
    },
    secondary: {
      main: "#5757f6"
    },
    background: {
      default: "#f8fbff",
      paper: "#ffffff"
    },
    text: {
      primary: "#08133b"
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 999,
          boxShadow: "none",
          fontWeight: 800
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 12px 34px rgba(8, 19, 59, 0.06)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    }
  }
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
