import { useColorScheme } from 'react-native';
import { useThemeStore, type ThemeMode } from '../store/themeStore';
import { Colors } from '../../constants';

type Scheme = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  white: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
    accent: string;
  };
  status: typeof Colors.status;
  premium: string;
  premiumText: string;
  premiumBg: string;
  overlay: string;
  scrim: string;
  shadow: string;
}

const lightColors: ThemeColors = {
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  primaryLight: Colors.primaryLight,
  primaryMuted: Colors.primaryMuted,
  secondary: Colors.secondary,
  secondaryDark: Colors.secondaryDark,
  secondaryLight: Colors.secondaryLight,
  white: Colors.white,
  background: Colors.background,
  surface: Colors.surface,
  surfaceElevated: Colors.surfaceElevated,
  border: Colors.border,
  borderStrong: Colors.borderStrong,
  text: Colors.text,
  status: Colors.status,
  premium: Colors.premium,
  premiumText: Colors.premiumText,
  premiumBg: Colors.premiumBg,
  overlay: Colors.overlay,
  scrim: Colors.scrim,
  shadow: Colors.shadow,
};

const darkColors: ThemeColors = {
  primary: Colors.dark.primary,
  primaryDark: Colors.dark.primaryDark,
  primaryLight: Colors.dark.primaryLight,
  primaryMuted: Colors.dark.primaryLight,
  secondary: Colors.dark.secondary,
  secondaryDark: Colors.dark.secondaryDark,
  secondaryLight: Colors.dark.secondaryLight,
  white: Colors.dark.surfaceElevated,
  background: Colors.dark.background,
  surface: Colors.dark.surface,
  surfaceElevated: Colors.dark.surfaceElevated,
  border: Colors.dark.border,
  borderStrong: Colors.dark.borderStrong,
  text: Colors.dark.text,
  status: Colors.status,
  premium: Colors.premium,
  premiumText: Colors.premiumText,
  premiumBg: '#3A2F11',
  overlay: Colors.dark.overlay,
  scrim: 'rgba(0,0,0,0.5)',
  shadow: '#000000',
};

export interface Theme {
  mode: ThemeMode;
  scheme: Scheme;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const systemScheme = (useColorScheme() ?? 'light') as Scheme;
  const scheme: Scheme = mode === 'system' ? systemScheme : mode;
  const isDark = scheme === 'dark';

  return {
    mode,
    scheme,
    isDark,
    colors: isDark ? darkColors : lightColors,
    setMode,
  };
}

export function useColors(): ThemeColors {
  return useTheme().colors;
}
