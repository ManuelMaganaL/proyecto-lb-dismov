import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '@/constants/colors';

type ThemeMode = 'system' | 'light' | 'dark';

const ThemeContext = createContext({
  dark: false,
  colors: COLORS.light,
  mode: 'system' as ThemeMode,
  setDark: (_dark: boolean) => {},
  setMode: (_mode: ThemeMode) => {},
});

const STORAGE_KEY = 'theme.mode';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const systemDark = systemColorScheme === 'dark';
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Derived from `mode` + system.
  const dark = mode === 'system' ? systemDark : mode === 'dark';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (stored === 'system' || stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
      } catch {
        // If storage fails, keep default 'system'.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // Non-fatal; keep in-memory mode.
    }
  };

  // Backwards-compatible API: if UI calls setDark(true/false),
  // we interpret that as an explicit user preference (not system).
  const setDark = async (nextDark: boolean) => {
    await setMode(nextDark ? 'dark' : 'light');
  };

  const theme = useMemo(
    () => ({
      dark,
      colors: dark ? COLORS.dark : COLORS.light,
      mode,
      setDark,
      setMode,
    }),
    [dark, mode]
  );

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);