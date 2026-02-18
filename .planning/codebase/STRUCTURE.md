# Codebase Structure

**Analysis Date:** 2026-02-18

## Directory Layout

```
pdfthumb.com/
├── src/                           # Source code root
│   ├── main.tsx                   # Application entry point
│   ├── App.tsx                    # Landing page component
│   ├── router.tsx                 # TanStack Router configuration
│   ├── types.ts                   # TypeScript type definitions
│   ├── constants.ts               # Application constants (pricing, nav links)
│   ├── api.ts                     # HTTP API functions
│   ├── db.ts                      # TanStack DB collections and helpers
│   ├── queryClient.ts             # TanStack React Query configuration
│   ├── paymentUtils.ts            # Payment-related utilities
│   ├── style.css                  # Global CSS (Tailwind directives)
│   ├── routeTree.gen.ts           # Auto-generated route tree (TanStack Router)
│   ├── components/                # Reusable UI components
│   │   ├── Hero.tsx               # Landing hero section
│   │   ├── Navbar.tsx             # Top navigation bar
│   │   ├── Footer.tsx             # Footer
│   │   ├── Button.tsx             # Reusable button component
│   │   ├── ConfirmationDialog.tsx  # Generic confirmation dialog
│   │   ├── FeaturesSection.tsx    # Features section on landing
│   │   ├── PricingSection.tsx     # Pricing comparison table
│   │   ├── PricingCard.tsx        # Individual pricing tier card
│   │   ├── OveragePricingSection.tsx  # Overage pricing section
│   │   ├── CTASection.tsx         # Call-to-action section
│   │   ├── icons.tsx              # SVG icon exports
│   │   └── dashboard/             # Dashboard-specific components
│   │       ├── DashboardLayout.tsx       # Dashboard wrapper with sidebar
│   │       ├── DashboardSidebar.tsx      # Sidebar navigation
│   │       ├── MetricCard.tsx            # Key metric display card
│   │       ├── UsageChart.tsx            # Line chart for usage trends
│   │       ├── BarChart.tsx              # Bar chart component
│   │       ├── PieChart.tsx              # Pie chart component
│   │       ├── DateRangePicker.tsx       # Date range selector
│   │       ├── ProfileSettingsForm.tsx   # User profile form
│   │       ├── ApiKeysManager.tsx        # API key management interface
│   │       └── ApiKeyGeneratedDialog.tsx # New key display dialog
│   ├── routes/                    # TanStack Router file-based routes
│   │   ├── __root.tsx             # Root layout (auth provider, navbar, footer)
│   │   ├── index.tsx              # Landing page (/) - renders App.tsx
│   │   ├── login.tsx              # Login page (/login)
│   │   ├── dashboard.tsx          # Dashboard layout (/dashboard) - protected
│   │   ├── auth/
│   │   │   └── callback.tsx       # OAuth callback handler (/auth/callback)
│   │   └── dashboard/
│   │       ├── overview.tsx       # Analytics overview (/dashboard/overview)
│   │       ├── settings.tsx       # Settings page (/dashboard/settings)
│   │       └── analytics.tsx      # Detailed analytics (/dashboard/analytics)
│   ├── hooks/                     # Custom React hooks
│   │   ├── useTheme.ts            # Dark mode toggle logic
│   │   └── AuthContext.tsx        # Authentication context and provider
│   ├── utils/                     # Utility functions
│   │   └── apiKey.ts              # API key masking utility
│   ├── data/                      # Mock data and fixtures
│   │   └── dashboardMocks.ts      # Mock dashboard metrics and analytics data
│   └── test/
│       └── setup.ts               # Test setup/configuration
├── tests/                         # Playwright E2E tests
│   ├── analytics-settings-updated.spec.ts
│   ├── auth-helper.ts             # Auth test helper
│   ├── branding-consistency.spec.ts
│   ├── dashboard.spec.ts
│   ├── index.spec.ts
│   ├── login.spec.ts
│   └── navigation.spec.ts
├── dist/                          # Build output (generated)
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite build configuration
├── tsconfig.json                  # TypeScript configuration
├── playwright.config.ts           # E2E test configuration
├── package.json                   # Dependencies and scripts
├── .prettierrc                    # Code formatting config
├── .prettierignore               # Files to skip prettier
└── .env                          # Environment variables (not committed)
```

## Directory Purposes

**src/components/:**
- Purpose: Reusable UI components and UI composition
- Contains: React TSX components, icons, styled sections
- Key files: Navbar.tsx, Footer.tsx, dashboard/* subdirectory

**src/routes/:**
- Purpose: TanStack Router file-based route definitions
- Contains: Route component exports using createFileRoute or createRootRoute
- Key files: __root.tsx (root layout), index.tsx (home), dashboard.tsx (protected)
- Pattern: Folder structure mirrors URL structure (/dashboard -> dashboard.tsx, /dashboard/settings -> dashboard/settings.tsx)

**src/hooks/:**
- Purpose: Custom React hooks for shared logic
- Contains: AuthContext provider/hook, useTheme hook
- Key files: AuthContext.tsx (authentication), useTheme.ts (theme management)

**src/data/:**
- Purpose: Mock data for development and testing
- Contains: Fixture generation, sample data
- Key files: dashboardMocks.ts (dashboard metrics, error logs, geographic data)

**src/utils/:**
- Purpose: Pure utility functions and helpers
- Contains: Non-component logic (masking, formatting, calculations)
- Key files: apiKey.ts (key masking), paymentUtils.ts (payment logic)

**tests/:**
- Purpose: End-to-end integration tests
- Contains: Playwright test specs
- Key files: dashboard.spec.ts, login.spec.ts, navigation.spec.ts

## Key File Locations

**Entry Points:**
- `index.html`: HTML bootstrap, loads src/main.tsx
- `src/main.tsx`: React app initialization, database setup, provider wrapping
- `src/routes/__root.tsx`: Root layout with AuthProvider, Navbar, Footer

**Configuration:**
- `vite.config.ts`: Build settings, API proxy, TanStack Router plugin setup
- `tsconfig.json`: TypeScript compiler options, path aliases (@/*, @components/*, etc)
- `playwright.config.ts`: E2E test configuration, base URL, browsers
- `package.json`: Dependencies and scripts (dev, build, preview, test)

**Core Logic:**
- `src/api.ts`: Fetch-based API functions (authApi, apiKeysApi)
- `src/db.ts`: TanStack DB collections and initialization helpers
- `src/router.tsx`: Router configuration and context definition
- `src/types.ts`: All TypeScript interfaces and types

**Landing Page:**
- `src/App.tsx`: Main landing page component
- `src/routes/index.tsx`: Route definition that renders App
- `src/components/Hero.tsx`, PricingSection.tsx, FeaturesSection.tsx, etc.

**Dashboard:**
- `src/routes/dashboard.tsx`: Route definition with auth check
- `src/components/dashboard/DashboardLayout.tsx`: Main dashboard layout wrapper
- `src/components/dashboard/DashboardSidebar.tsx`: Left navigation
- `src/routes/dashboard/overview.tsx`: Metrics and overview page
- `src/routes/dashboard/settings.tsx`: API keys and profile management
- `src/routes/dashboard/analytics.tsx`: Detailed analytics page

**Authentication:**
- `src/hooks/AuthContext.tsx`: Auth state management and provider
- `src/routes/login.tsx`: Login page route
- `src/routes/auth/callback.tsx`: OAuth callback handler

**Testing:**
- `tests/*.spec.ts`: Playwright test files
- `src/test/setup.ts`: Test configuration
- `tests/auth-helper.ts`: Authentication test utilities

## Naming Conventions

**Files:**
- Components: PascalCase.tsx (e.g., `Hero.tsx`, `MetricCard.tsx`)
- Hooks: camelCase.ts or camelCase.tsx (e.g., `useTheme.ts`, `AuthContext.tsx`)
- Utilities: camelCase.ts (e.g., `apiKey.ts`, `paymentUtils.ts`)
- Routes: lowercase.tsx with folder structure (e.g., `dashboard/settings.tsx`)
- Test files: *.spec.ts (e.g., `dashboard.spec.ts`)

**Directories:**
- Feature folders: lowercase plural (e.g., `components/`, `routes/`, `hooks/`, `utils/`)
- Dashboard subfolder: lowercase (`components/dashboard/`)
- Auth subfolder: lowercase (`routes/auth/`)

**Components:**
- PascalCase for component names matching file names (e.g., Hero in Hero.tsx)
- Descriptive names with domain (e.g., MetricCard, ApiKeysManager, DashboardLayout)

**Types and Interfaces:**
- PascalCase (e.g., `User`, `AuthTokens`, `ApiKey`, `DashboardSummary`)
- Suffixes: State (AuthState), Props (AuthProviderProps), Context (AuthContextType)

**Functions:**
- camelCase for utility functions (e.g., `maskApiKey()`, `calculateTrend()`)
- useXxx pattern for hooks (e.g., `useAuth()`, `useTheme()`)

**Constants:**
- UPPER_SNAKE_CASE for constants (e.g., `TOKEN_STORAGE_KEY`, `API_BASE_URL`)
- Collections and arrays: Plural (e.g., `PRICING_TIERS`, `NAV_LINKS`)

## Where to Add New Code

**New Feature (e.g., Usage Reports):**
- Primary code: `src/routes/dashboard/reports.tsx` (new route)
- Components: `src/components/dashboard/ReportCard.tsx`, `ReportChart.tsx`
- Data/Types: Add to `src/types.ts`, mock data to `src/data/dashboardMocks.ts`
- API calls: Add to `src/api.ts` as new function in reportApi object
- Tests: `tests/reports.spec.ts`

**New Landing Section:**
- Component: `src/components/NewSection.tsx`
- Import in: `src/App.tsx`
- Styling: Use Tailwind CSS with dark mode classes

**New Utility/Helper:**
- Location: `src/utils/newUtil.ts`
- Export functions and constants
- Add tests in `tests/` if integration-heavy

**New Hook:**
- Location: `src/hooks/useNewFeature.ts`
- Or as context: `src/hooks/NewContext.tsx` if state management needed
- Export hook or Provider + hook

**New API Integration:**
- Location: Add module to `src/api.ts`
- Pattern: Export named object with async methods (newApi.getXxx, newApi.postXxx)
- Include error handling and timeout logic

**New Type:**
- Location: `src/types.ts`
- Add interface/type with JSDoc comments
- Keep related types grouped together

## Special Directories

**node_modules/:**
- Purpose: Package dependencies
- Generated: Yes (install via bun install)
- Committed: No

**dist/:**
- Purpose: Production build output
- Generated: Yes (vite build)
- Committed: No

**artifacts/:**
- Purpose: Build artifacts and generated files
- Generated: Yes
- Committed: No

**.idea/:**
- Purpose: IntelliJ IDE configuration
- Generated: Yes (IDE auto-creates)
- Committed: No

**.tanstack/tmp/:**
- Purpose: TanStack internal cache
- Generated: Yes
- Committed: No

**generated-plans/:**
- Purpose: Auto-generated planning documents
- Generated: Yes (by GSD system)
- Committed: No

**.planning/codebase/:**
- Purpose: Architecture and code analysis documents
- Generated: Yes (by GSD mappers)
- Committed: No (or yes, depending on workflow)

---

*Structure analysis: 2026-02-18*
