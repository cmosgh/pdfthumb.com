import React, { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark";

export const useTheme = (): [Theme, () => void] => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if window is defined (for SSR or environments where window is not immediately available)
    if (typeof window === "undefined") {
      return "light"; // Default to light if window is not available
    }
    try {
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (e) {
      // Fallback if localStorage or matchMedia is not available or errors out
      return "light";
    }
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // Ignore errors if localStorage is not available
      console.warn("Could not save theme to localStorage:", e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  return [theme, toggleTheme];
};
