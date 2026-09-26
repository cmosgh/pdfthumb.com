import React, { useState } from "react";
import { APP_NAME, HOME_LINK, NAV_LINKS } from "@/constants.ts";
import { MoonIcon, SunIcon } from "./icons.tsx";
import BrandMark from "./BrandMark.tsx";
import type { Theme } from "../hooks/useTheme.ts";
import { useAuth } from "../hooks/AuthContext";
import {
  Container,
  IconButton,
  MenuIcon,
  RouterButtonLink,
  RouterTextLink,
  Surface,
  Text,
  TextButton,
  XMarkIcon,
} from "./ui";

interface NavbarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Surface as="header" tone="bar" className="sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Brand logo and name. It's the one part that may shrink, so the
              row fits 320 px even in a wider fallback font (#136). */}
          <div className="min-w-0">
            <RouterTextLink
              {...HOME_LINK}
              tone="link"
              className="flex items-center space-x-2 min-w-0"
            >
              <BrandMark />
              <Text
                as="span"
                weight="bold"
                size="xl"
                tone="fg"
                className="min-w-0"
                data-testid="brand-name-wrapper"
              >
                <span
                  className="block md:hidden truncate"
                  data-testid="brand-name-mobile"
                >
                  {APP_NAME}
                </span>
                <span
                  className="hidden md:block"
                  data-testid="brand-name-desktop"
                >
                  {APP_NAME}
                </span>
              </Text>
            </RouterTextLink>
          </div>
          <nav className="hidden md:flex space-x-8">
            {NAV_LINKS.map((link) => (
              <RouterTextLink key={link.name} {...link.linkOptions} tone="nav">
                {link.name}
              </RouterTextLink>
            ))}
          </nav>
          {/* Narrower gaps below sm: at 320 px the row had no slack (#136) */}
          <div className="flex shrink-0 items-center space-x-2 sm:space-x-4">
            <IconButton
              variant="round"
              onClick={toggleTheme}
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              {theme === "light" ? (
                <MoonIcon className="h-6 w-6" />
              ) : (
                <SunIcon className="h-6 w-6" />
              )}
            </IconButton>

            {isAuthenticated ? (
              <>
                <RouterTextLink
                  to="/dashboard"
                  tone="navSm"
                  className="mr-2 hidden sm:block"
                >
                  Dashboard
                </RouterTextLink>
                <div className="flex items-center space-x-2">
                  <Text
                    as="span"
                    size="sm"
                    tone="fg-muted"
                    className="hidden sm:block"
                  >
                    {user?.name || user?.email}
                  </Text>
                  <TextButton
                    onClick={handleLogout}
                    tone="navSm"
                    className="mr-2"
                  >
                    Logout
                  </TextButton>
                </div>
              </>
            ) : (
              <>
                <RouterTextLink
                  to="/login"
                  tone="navSm"
                  className="mr-2 hidden sm:block"
                >
                  Log In
                </RouterTextLink>
                {/* API keys live in the dashboard, behind sign-in. No checkout
                    while pricing is upcoming (#71). */}
                <RouterButtonLink
                  to="/login"
                  variant="navCta"
                  data-testid="navbar-api-key"
                >
                  Get API Key
                </RouterButtonLink>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden flex shrink-0 items-center">
            <IconButton
              variant="bare"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </IconButton>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <Surface tone="menu" className="md:hidden pb-4">
          <nav
            className="flex flex-col items-center space-y-4"
            aria-label="Mobile Menu"
          >
            {NAV_LINKS.map((link) => (
              <RouterTextLink
                key={link.name}
                {...link.linkOptions}
                tone="nav"
                onClick={toggleMobileMenu} // Close menu on link click
              >
                {link.name}
              </RouterTextLink>
            ))}

            {isAuthenticated ? (
              <>
                <RouterTextLink
                  to="/dashboard"
                  tone="nav"
                  onClick={toggleMobileMenu}
                >
                  Dashboard
                </RouterTextLink>
                <div className="text-center">
                  <Text
                    as="span"
                    size="sm"
                    tone="fg-muted"
                    className="block mb-2"
                  >
                    {user?.name || user?.email}
                  </Text>
                  <TextButton
                    tone="nav"
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                  >
                    Logout
                  </TextButton>
                </div>
              </>
            ) : (
              <RouterTextLink to="/login" tone="nav" onClick={toggleMobileMenu}>
                Log In
              </RouterTextLink>
            )}
          </nav>
        </Surface>
      )}
    </Surface>
  );
};

export default Navbar;
