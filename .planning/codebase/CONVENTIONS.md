# Coding Conventions

**Analysis Date:** 2026-02-18

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `Navbar.tsx`, `PricingCard.tsx`, `DashboardLayout.tsx`)
- Utilities and helpers: camelCase with `.ts` extension (e.g., `apiKey.ts`, `paymentUtils.ts`)
- Type definition files: `types.ts`
- Hooks: `use` prefix with camelCase (e.g., `useTheme.ts`, `AuthContext.tsx` for context providers)
- Constants: `constants.ts` exported as uppercase strings and arrays
- API modules: descriptive noun with `.ts` (e.g., `api.ts`, `db.ts`)
- Context providers: `Context.tsx` suffix (e.g., `AuthContext.tsx`)

**Functions:**
- Exported arrow functions: camelCase (e.g., `maskApiKey`, `handleInitiateCheckout`)
- React components (FC): PascalCase (e.g., `const App: React.FC = () => ...`)
- Event handlers: `handle` prefix + PascalCase action (e.g., `handleLogout`, `handleCtaClick`)
- Toggle functions: `toggle` prefix (e.g., `toggleTheme`, `toggleMobileMenu`)
- Helper functions: descriptive camelCase (e.g., `getHeaders`, `maskApiKey`, `loadAuthState`)

**Variables:**
- Constants: UPPER_SNAKE_CASE for primitives (e.g., `API_BASE_URL`, `TOKEN_STORAGE_KEY`)
- State variables: camelCase (e.g., `isMobileMenuOpen`, `isAuthenticated`)
- React hooks state: camelCase with `set` prefix for setters (e.g., `setTheme`, `setAuthState`)
- Object properties: camelCase (e.g., `accessToken`, `expiresAt`)

**Types:**
- Interfaces: PascalCase with `Props` suffix for component props (e.g., `ButtonProps`, `NavbarProps`, `DateRangePickerProps`)
- Interfaces for API/domain objects: PascalCase, descriptive names (e.g., `User`, `AuthTokens`, `PricingTier`)
- Type aliases: PascalCase (e.g., `Theme`, `BillingCycle`)

## Code Style

**Formatting:**
- Tool: Prettier 3.6.2
- Config file: `.prettierrc` (contains empty object `{}`, using defaults)
- Default Prettier settings applied: 2-space indentation, single quotes not enforced (uses double), trailing commas where applicable

**Linting:**
- No ESLint configuration detected in project root
- Standard TypeScript compiler used with strict mode

**Import statements:**
- React imports at top: `import React from "react"` or `import type React from "react"` for type-only imports
- Path aliases used: `@/` prefix for src imports (e.g., `import { APP_NAME } from "@/constants.ts"`)
- Explicit file extensions required: `.ts` and `.tsx` extensions included in imports
- Third-party imports first, then relative imports
- Grouped by category: React/framework imports, third-party libraries, local types, local components/utilities

## Error Handling

**Patterns:**
- Try-catch blocks with error logging via `console.error()` (e.g., in `AuthContext.tsx`, `api.ts`)
- Graceful fallbacks: Functions catch errors and return safe defaults or continue with partial state
- Auth-specific: Token refresh failures clear auth state to prevent locked states
- API calls: JSON parsing errors caught separately (e.g., in `AuthContext.tsx` line 64-66)
- Timeout handling: AbortController used for fetch requests with setTimeout cleanup (e.g., in `api.ts` getApiKeys)
- localStorage access: Wrapped in try-catch to handle unavailability (e.g., in `useTheme.ts` lines 11-22)

## Logging

**Framework:** Native `console` object (console.error, console.warn)

**Patterns:**
- Error logging: `console.error(message, error)` with descriptive context
- Examples from codebase:
  - `console.error("Token refresh API error:", error)` - API errors
  - `console.error("Logout API call failed:", error)` - Silent failures that continue
  - `console.warn("Could not save theme to localStorage:", e)` - Non-critical issues
  - `console.warn(\`Failed to update API key ${key.id}:\`, updateError)` - Partial operation failures

## Comments

**When to Comment:**
- JSDoc for public functions and utilities
- Inline comments for complex logic or non-obvious decisions
- TODO/FIXME comments avoided in analyzed code
- Comments for workarounds or browser compatibility issues
- Detailed explanations in event handlers for interaction flow

**JSDoc/TSDoc:**
- Used in utility functions (e.g., `maskApiKey` in `src/utils/apiKey.ts`):
  ```typescript
  /**
   * Masks an API key for secure display
   * Format: ####********#### (first 4, 8 asterisks, last 4)
   * @param key - The full API key to mask
   * @returns Masked key string
   */
  export const maskApiKey = (key: string): string => {
  ```
- Parameter and return types documented with `@param` and `@returns`

## Function Design

**Size:** Functions are typically small and focused (10-50 lines)
  - Complex components like `PricingCard.tsx` (150 lines) break logic into smaller parts
  - Helper functions in API modules are 5-20 lines
  - React hooks keep business logic separate from UI rendering

**Parameters:**
- Props pattern: Use interfaces extending React element attributes where needed (e.g., `ButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>`)
- Function parameters: Named parameters for clarity, destructured where applicable
- Optional parameters: Use `?` notation in interfaces (e.g., `picture?: string`)
- Default values: Provided in function signatures or via switch statements for CSS variants

**Return Values:**
- Components: Return JSX (e.g., `return <component />`)
- Hooks: Return tuple `[value, setter]` or object with methods
- API functions: Return promise of parsed JSON response
- Async functions: Always return Promise type (e.g., `async refresh(token): Promise<...>`)
- Error cases: Throw Error instances for promise rejection

## Module Design

**Exports:**
- Named exports for utilities and constants: `export const functionName = ...`
- Named exports for interfaces: `export interface InterfaceName { ... }`
- Default exports for components: `export default ComponentName`
- Context provider exported as named export: `export const AuthProvider`
- Context hook exported as named export: `export const useAuth`
- Barrel file pattern: In `db.ts`, collections exported individually then grouped in `collections` object

**Barrel Files:**
- `constants.ts` exports multiple constants and arrays
- `types.ts` exports all domain/API types
- `api.ts` exports multiple API object groups (`authApi`, `apiKeysApi`)
- Dashboard components have no explicit barrel file; imported individually

**Re-exports:**
- Local types re-exported from `types.ts` in components (e.g., `import type { PricingTier } from "../types"`)
- Utilities re-exported from index files when needed

---

*Convention analysis: 2026-02-18*
