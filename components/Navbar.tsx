import React from "react";
import { APP_NAME, NAV_LINKS } from "../constants.ts";
import { DocumentIcon, MoonIcon, SunIcon } from "./icons.tsx";
import type { Theme } from "../hooks/useTheme.ts";
import { handleInitiateCheckout } from "../paymentUtils.ts";

interface NavbarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const handleGetApiKeyClick = () => {
    handleInitiateCheckout("pro");
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a
              href="#"
              className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-500"
            >
              <DocumentIcon className="h-8 w-8" />
              <span className="font-bold text-xl text-slate-800 dark:text-slate-100">
                {APP_NAME}
              </span>
            </a>
          </div>
          <nav className="hidden md:flex space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:outline-none"
            >
              {theme === "light" ? (
                <MoonIcon className="h-6 w-6" />
              ) : (
                <SunIcon className="h-6 w-6" />
              )}
            </button>
            <a
              href="#login" // Placeholder for actual login link/modal
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 mr-2 hidden sm:block"
            >
              Log In
            </a>
            <a
              href="#signup" // Placeholder for actual signup link/modal
              onClick={(e) => {
                e.preventDefault();
                handleGetApiKeyClick();
              }}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-transform transform hover:scale-105 text-sm"
            >
              Get API Key
            </a>
          </div>
          {/* Mobile menu button (optional, for simplicity not fully implemented here) */}
          <div className="md:hidden">{/* Hamburger Icon */}</div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
