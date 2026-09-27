'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ActiveTheme = 'dark' | 'light';

/**
 * Named color palette presets â€” applied on top of the base dark/light theme.
 * 'default' = use the built-in dark/light variables unchanged.
 */
export type ColorPalette =
  | 'default'
  | 'black-white'
  | 'red-black'
  | 'white-red'
  | 'blue-grey';

export const COLOR_PALETTE_META: Record<
  ColorPalette,
  { label: string; description: string; swatches: string[]; baseMode: ThemeMode }
> = {
  default: {
    label: 'AppleVision Dark',
    description: 'Signature obsidian-dark theme — vibrant Apple crimson accents on deep black',
    swatches: ['#000000', '#e61e25', '#f5f5f7'],
    baseMode: 'dark',
  },
  'black-white': {
    label: 'Black & White',
    description: 'Ultra-crisp monochrome — pure black surfaces with high-contrast white text and controls',
    swatches: ['#000000', '#ffffff', '#27272a'],
    baseMode: 'dark',
  },
  'red-black': {
    label: 'Red & Black',
    description: 'Bold crimson accent on deep matte black surfaces',
    swatches: ['#080000', '#e61e25', '#ffffff'],
    baseMode: 'dark',
  },
  'white-red': {
    label: 'White & Red',
    description: 'Clean retail white background with signature red accents',
    swatches: ['#ffffff', '#e61e25', '#0f172a'],
    baseMode: 'light',
  },
  'blue-grey': {
    label: 'Blue, White & Grey',
    description: 'Professional corporate — cobalt blue accents with crisp light surfaces',
    swatches: ['#1e3a5f', '#3b82f6', '#f8fafc'],
    baseMode: 'light',
  },
};

// CSS class applied to <html> for each palette
const PALETTE_CLASS: Record<ColorPalette, string> = {
  default: '',
  'black-white': 'palette-black-white',
  'red-black': 'palette-red-black',
  'white-red': 'palette-white-red',
  'blue-grey': 'palette-blue-grey',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  colorPalette: ColorPalette;
  setThemeMode: (mode: ThemeMode) => void;
  setColorPalette: (palette: ColorPalette) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem('applevision_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch (e) {}
    return 'dark';
  });

  const [colorPalette, setColorPaletteState] = useState<ColorPalette>(() => {
    if (typeof window === 'undefined') return 'default';
    try {
      const saved = localStorage.getItem('applevision_color_palette') as ColorPalette;
      if (saved && saved in COLOR_PALETTE_META) return saved;
    } catch (e) {}
    return 'default';
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>('dark');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      // Determine the effective dark/light base
      let resolved: ActiveTheme = 'dark';
      if (colorPalette !== 'default') {
        // Palette dictates the base
        resolved = COLOR_PALETTE_META[colorPalette].baseMode === 'light' ? 'light' : 'dark';
      } else if (themeMode === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = themeMode;
      }

      setActiveTheme(resolved);

      // Apply dark/light class
      if (resolved === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }

      // Remove all palette classes first
      Object.values(PALETTE_CLASS).forEach((cls) => {
        if (cls) root.classList.remove(cls);
      });

      // Apply new palette class
      const cls = PALETTE_CLASS[colorPalette];
      if (cls) root.classList.add(cls);
    };

    applyTheme();

    // Watch system preference only when palette is default + system mode
    if (colorPalette === 'default' && themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [themeMode, colorPalette]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('applevision_theme', mode);
  };

  const setColorPalette = (palette: ColorPalette) => {
    setColorPaletteState(palette);
    localStorage.setItem('applevision_color_palette', palette);
  };

  const toggleTheme = () => {
    if (themeMode === 'dark') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('system');
    else setThemeMode('dark');
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, activeTheme, colorPalette, setThemeMode, setColorPalette, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
