import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { APP_NAME, NAV_LINKS } from "../constants.ts";
import { DocumentIcon, MoonIcon, SunIcon } from "./icons.tsx";
import type { Theme } from "../hooks/useTheme.ts";
import { handleInitiateCheckout } from "../paymentUtils.ts";

interface NavbarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleGetApiKeyClick = () => {
    handleInitiateCheckout("pro");
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand logo and name */}
          <div className="flex-none">
            <Link
              to="/"
              className="md:hidden flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-500"
            >
              <DocumentIcon className="h-8 w-8" />
              <span className="font-bold text-xl text-slate-800 dark:text-slate-100">
                {APP_NAME.replace(".com", "")}
              </span>
            </Link>
            <Link
              to="/"
              className="hidden md:flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-500"
            >
              <DocumentIcon className="h-8 w-8" />
              <span className="font-bold text-xl text-slate-800 dark:text-slate-100">
                {APP_NAME}
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {link.name}
              </Link>
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
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 mr-2 hidden sm:block"
            >
              Log In
            </Link>
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
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-slate-500 dark:text-slate-400 focus:outline-none focus:text-slate-600 dark:focus:text-slate-300"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-800 shadow-lg pb-4">
          <nav
            className="flex flex-col items-center space-y-4"
            aria-label="Mobile Menu"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                onClick={toggleMobileMenu} // Close menu on link click
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
