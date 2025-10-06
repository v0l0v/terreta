import React from 'react';
import { ThemeProvider as CustomThemeProvider } from "@/shared/hooks/useTheme"
import { type ThemeProviderProps } from "@/shared/hooks/useTheme"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return React.createElement(CustomThemeProvider, props, children);
}