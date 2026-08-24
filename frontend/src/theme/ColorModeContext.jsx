import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const STORAGE_KEY = "smartspend_theme_mode";

const ColorModeContext = createContext(null);

function getInitialMode() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Same primary blue used throughout the app (MUI's default #1976d2, ~4.6:1
// contrast with white — meets WCAG AA). In dark mode the header instead uses
// grey.900 (~16:1 contrast with white) since a light-mode-bright blue bar
// reads poorly against a dark app body; primary blue stays reserved for
// buttons/links/active nav, where MUI auto-picks a lighter shade with a
// readable contrastText for the dark palette.
function buildTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#1976d2" },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor:
              theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.primary.main,
            color: theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.primary.contrastText,
          }),
        },
      },
    },
  });
}

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      },
    }),
    [mode]
  );

  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within a ColorModeProvider");
  }
  return ctx;
}
