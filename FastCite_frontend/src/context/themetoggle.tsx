import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./themecontext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)] transition-all"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon size={20} className="text-[var(--color-text-secondary)]" />
      ) : (
        <Sun size={20} className="text-[var(--color-text-secondary)]" />
      )}
    </button>
  );
};

export default ThemeToggle;
