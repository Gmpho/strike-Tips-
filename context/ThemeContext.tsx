import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Defines the possible theme values.
type Theme = 'light' | 'dark';

// Defines the shape of the theme context's value.
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create the context with an undefined default value.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * The ThemeProvider component manages the application's current theme (light or dark).
 * It persists the user's choice to localStorage and applies the corresponding
 * class to the root HTML element to enable Tailwind CSS's dark mode styling.
 */
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize the theme state with a function to ensure it runs only once.
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      // 1. Check for a previously saved theme in localStorage.
      const storedTheme = window.localStorage.getItem('theme') as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
      // 2. If no saved theme, check the user's OS preference.
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      // 3. Fallback to a default theme if localStorage or matchMedia is not available.
      return 'dark';
    }
  });

  /**
   * Effect that runs whenever the theme state changes.
   * It updates the class on the `<html>` element and saves the new theme to localStorage.
   */
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';

    // Remove the opposite theme class and add the current one.
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);
    
    // Persist the theme choice.
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {
        console.error("Could not save theme to local storage.", e);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook `useTheme` for easy access to the theme context.
 * @returns The theme context value.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};