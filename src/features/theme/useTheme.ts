import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DensityMode = 'comfortable' | 'compact';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('kaya_theme_mode') as ThemeMode | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      return saved;
    }
    // Fallback based on existing dark mode flag
    return localStorage.getItem('kaya_dark_mode') === 'true' ? 'dark' : 'light';
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    const saved = localStorage.getItem('kaya_density') as DensityMode | null;
    return saved === 'compact' ? 'compact' : 'comfortable';
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaya_reduce_motion');
    if (saved !== null) {
      return saved === 'true';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Apply Theme
  const applyTheme = useCallback((mode: ThemeMode) => {
    let isDark = false;
    if (mode === 'dark') {
      isDark = true;
    } else if (mode === 'light') {
      isDark = false;
    } else {
      isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('kaya_dark_mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('kaya_dark_mode', 'false');
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('kaya_theme_mode', newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // Apply Density
  const setDensity = useCallback((newDensity: DensityMode) => {
    setDensityState(newDensity);
    localStorage.setItem('kaya_density', newDensity);
    if (newDensity === 'compact') {
      document.documentElement.setAttribute('data-density', 'compact');
    } else {
      document.documentElement.removeAttribute('data-density');
    }
  }, []);

  // Apply Reduce Motion
  const setReduceMotion = useCallback((enabled: boolean) => {
    setReduceMotionState(enabled);
    localStorage.setItem('kaya_reduce_motion', enabled ? 'true' : 'false');
    if (enabled) {
      document.documentElement.setAttribute('data-reduce-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduce-motion');
    }
  }, []);

  // Initial mount & system preference listener
  useEffect(() => {
    applyTheme(theme);

    if (density === 'compact') {
      document.documentElement.setAttribute('data-density', 'compact');
    } else {
      document.documentElement.removeAttribute('data-density');
    }

    if (reduceMotion) {
      document.documentElement.setAttribute('data-reduce-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduce-motion');
    }

    // Media query listener for system theme changes
    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, density, reduceMotion, applyTheme]);

  return {
    theme,
    setTheme,
    density,
    setDensity,
    reduceMotion,
    setReduceMotion,
  };
}
