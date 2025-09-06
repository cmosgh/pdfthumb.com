# Phase 3: Detailed Analytics & Settings

**Goal:** Enhance the analytics section with more granular data views and implement the initial user settings management, including API key management and profile updates.

**Technical Details:**

*   **Components to Create/Update:**
    *   `src/routes/dashboard/analytics.tsx`: The main page component for the `/dashboard/analytics` route. It will house various detailed charts and filtering options.
    *   `src/routes/dashboard/settings.tsx`: The main page component for the `/dashboard/settings` route. It will contain sub-sections for API keys, profile, and potentially billing.
    *   `src/components/dashboard/DateRangePicker.tsx`: A reusable component for selecting custom date ranges. This will be crucial for filtering analytics data. Consider using a library like `react-day-picker` or building a custom one with Tailwind.
    *   `src/components/dashboard/ApiKeysManager.tsx`: Component to display existing API keys, and provide functionality to generate new ones and revoke old ones. This will involve displaying sensitive information securely (e.g., masked keys).
    *   `src/components/dashboard/ProfileSettingsForm.tsx`: A form component for users to view and update their basic profile information (e.g., name, email, company).
    *   **New Chart Components:** Depending on the specific detailed analytics, you might need specialized chart components (e.g., `BarChartByFileType.tsx`, `ErrorRateChart.tsx`).

*   **New/Changed Files:**
    *   `src/routes/dashboard/analytics.tsx`
    *   `src/routes/dashboard/settings.tsx`
    *   `src/components/dashboard/DateRangePicker.tsx`
    *   `src/components/dashboard/ApiKeysManager.tsx`
    *   `src/components/dashboard/ProfileSettingsForm.tsx`
    *   `src/data/dashboardMocks.ts`
    *   `tests/analytics-settings-updated.spec.ts`

*   **Data Fetching & Management:**
    *   **Mock Data Extension:** Extend `src/data/dashboardMocks.ts` to include more complex data structures for:
        *   Detailed analytics (e.g., usage breakdown by file type, error logs with timestamps, geographical data).
        *   User settings (current API keys, user profile data).
    *   **API Integration Strategy:** Anticipate the following API endpoints:
        *   `GET /api/analytics/detailed?startDate=...&endDate=...`: For detailed usage data.
        *   `GET /api/user/profile`: To fetch user profile.
        *   `PUT /api/user/profile`: To update user profile.
        *   `GET /api/user/api-keys`: To list API keys.
        *   `POST /api/user/api-keys`: To generate a new API key.
        *   `DELETE /api/user/api-keys/{keyId}`: To revoke an API key.
    *   **State Management:** Continue using `useState`/`useEffect` with mocks, or transition to `react-query` for more robust data handling, especially for forms and mutations (generating/revoking keys).

*   **Data Visualization:**
    *   Implement more diverse chart types in `AnalyticsPage.tsx` using the chosen charting library (e.g., bar charts for categorical data, pie/donut charts for distribution, area charts for cumulative trends).
    *   Ensure charts are interactive (tooltips, legends).

*   **Styling (Tailwind CSS):**
    *   Apply Tailwind for form styling (`input`, `button`, `label` elements), ensuring consistency with existing project forms.
    *   Design tables for displaying API keys and potentially detailed log data.
    *   Use Tailwind's grid and flex utilities for complex layouts within `AnalyticsPage.tsx` and `SettingsPage.tsx`.
    *   Ensure all new components are fully responsive.

**Checklist:**

*   [x] Create `src/routes/dashboard/analytics.tsx`.
*   [x] Create `src/routes/dashboard/settings.tsx`.
*   [x] Create `src/components/dashboard/DateRangePicker.tsx`.
*   [x] Implement date range filtering functionality in `AnalyticsPage.tsx` using `DateRangePicker`.
*   [x] Display at least two new detailed analytics charts in `AnalyticsPage.tsx` (e.g., usage by file type, errors over time).
*   [x] Create `src/components/dashboard/ApiKeysManager.tsx`.
*   [x] Implement API key listing, generation (mocked), and revocation (mocked) in `ApiKeysManager.tsx`.
*   [x] Create `src/components/dashboard/ProfileSettingsForm.tsx`.
*   [x] Implement user profile display and update functionality (mocked) in `ProfileSettingsForm.tsx`.
*   [x] Define extended mock data for detailed analytics and user settings.
*   [x] Write Playwright integration tests to verify:
    *   Navigation to `/dashboard/analytics` and interaction with `DateRangePicker`.
    *   Navigation to `/dashboard/settings` and basic interaction with `ApiKeysManager` and `ProfileSettingsForm`.