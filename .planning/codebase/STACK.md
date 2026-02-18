# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- TypeScript 5.9.3 - Full application codebase (frontend and test configs)
- JSX/TSX - React component markup (`src/components/`, `src/routes/`)

**Secondary:**
- Node.js - Development and testing runtime

## Runtime

**Environment:**
- Node.js 22 (Alpine) - Specified in Dockerfile for production builds
- LTS version - Used in CI/CD workflows (.github/workflows/)

**Package Manager:**
- npm - Primary package manager (package-lock.json present)
- Bun - Alternative package manager available (bun.lock present)

## Frameworks

**Core Frontend:**
- React 19.1.0 - UI library for components
- @tanstack/react-router 1.132.25 - File-based routing system with auto code-splitting
- @tanstack/react-query 5.90.2 - Data fetching and state management

**Styling:**
- Tailwind CSS 4.1.13 - Utility-first CSS framework
- @tailwindcss/vite 4.1.13 - Vite integration for Tailwind

**Data Management:**
- @tanstack/db 0.4.1 - Local database library
- @tanstack/react-db 0.1.23 - React integration for TanStack DB
- @tanstack/query-db-collection 0.2.22 - Database collection querying

**Charts & Visualization:**
- recharts 3.1.2 - React charting library for analytics displays

**Routing & Navigation:**
- @tanstack/router-devtools 1.132.7 - Routing debugging tools

**Testing & Quality:**
- @playwright/test 1.56.1 - End-to-end browser testing framework
- dotenv 17.2.2 - Environment variable management for test config

## Key Dependencies

**Critical:**
- @tanstack/react-router - Provides file-based routing with auto code-splitting enabled via vite plugin
- @tanstack/react-query - Handles API data fetching with 5-minute stale time and 3 retry attempts
- @tanstack/db - Powers local-only data storage with collections for dashboard, analytics, API keys, and user profiles
- React 19.1.0 - Core UI rendering

**Development:**
- prettier 3.6.2 - Code formatting (configured with empty object in .prettierrc)
- TypeScript 5.9.3 - Type checking and compilation
- Vite 7.3.1 - Build tool and dev server
- vite-tsconfig-paths 5.1.4 - TypeScript path alias resolution
- @types/react, @types/react-dom, @types/node - Type definitions

## Configuration

**Environment:**
- Environment variables via Vite: `GEMINI_API_KEY`, `API_URL`, `TEST_API_KEY`
- Variables injected at build time in `vite.config.ts`
- `.env` and `.env.local` files present (contains environment configuration)
- Accessible in code via `import.meta.env` and `process.env` (injected by Vite)

**Build:**
- `vite.config.ts` - Main build configuration
  - Tailwind CSS compilation
  - TanStack Router code-splitting and route tree generation
  - Path alias resolution (@/, @components/, @hooks/, @utils/, @routes/)
  - CORS proxy to localhost:3000 for /api requests
  - Chunk size warning threshold: 500KB
  - Build warnings suppressed for "use client" directives

**TypeScript:**
- `tsconfig.json` - Strict mode enabled
  - Target: ES2022
  - Module resolution: bundler
  - Path aliases for @/, @components/, @hooks/, @utils/, @routes/
  - JSX mode: react-jsx
  - Experimental decorators enabled

## Platform Requirements

**Development:**
- Node.js 22 (or LTS version)
- npm or Bun for package management
- Vite dev server on port (default 5173)
- API proxy requires backend on localhost:3000

**Production:**
- Nginx 1.25+ (Alpine) - Web server for static assets
- Docker containerization available (multi-stage build)
- Output: Static HTML/CSS/JS bundle in `/dist` directory
- Port: 80 (HTTP via Nginx)

## Scripts

**Development:**
```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Build for production (TypeScript + Vite + Tailwind)
npm run preview      # Preview production build locally
```

**Testing:**
```bash
npm run test         # Run Playwright e2e tests
```

## Quality Tooling

**Linting/Formatting:**
- Prettier 3.6.2 - Code formatting
- ESLint - Not explicitly configured (TypeScript strict mode used instead)

**Commit Standards:**
- commitlint 19.5.0 - Commit message validation
- commitlint config: conventional - Conventional Commits standard
- Git hooks available (commitlint.config.cjs)

---

*Stack analysis: 2026-02-18*
