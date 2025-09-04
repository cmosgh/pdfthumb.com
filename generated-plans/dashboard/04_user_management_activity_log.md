# Phase 4: User Management & Activity Log

**Goal:** Implement features for managing users (if the dashboard serves an administrative purpose) and displaying a chronological log of significant system or user-specific events.

**Technical Details:**

*   **Components to Create/Update:**
    *   `src/routes/dashboard/users.tsx`: (Conditional) This would be the main page component for a `/dashboard/users` route, if user management is a required feature. It would orchestrate the `UserTable` and potentially user detail views.
    *   `src/components/dashboard/UserTable.tsx`: (Conditional) A component to display a paginated and sortable list of users. It should accept props for user data and handle pagination/sorting logic or delegate it to a parent.
        *   Columns: User ID, Email, Plan, Last Login, Status.
        *   Actions: View Details (link to `UserDetailPage.tsx` if implemented).
    *   `src/routes/dashboard/activity-log.tsx`: The main page component for the `/dashboard/activity-log` route. It will display a feed of system or user-specific events.
    *   `src/components/dashboard/ActivityLogEntry.tsx`: A component to render a single entry in the activity log. It should display:
        *   `timestamp: string`
        *   `eventType: string` (e.g., 'PDF_UPLOADED', 'API_KEY_GENERATED')
        *   `description: string` (e.g., 'User X uploaded document Y')
        *   `userId?: string` (link to user details if applicable)

*   **Data Fetching & Management:**
    *   **Mock Data:** Create mock data structures in `src/data/dashboardMocks.ts` for:
        *   A list of dummy users with various attributes.
        *   A chronological list of activity log entries, including different event types.
    *   **API Integration Strategy:** Anticipate the following API endpoints:
        *   `GET /api/users?page=...&limit=...&sort=...`: To fetch a paginated list of users.
        *   `GET /api/activity-log?page=...&limit=...&filter=...`: To fetch a paginated and filterable activity log.
    *   **State Management:** Use `useState`/`useEffect` for initial data display. For pagination, sorting, and filtering, consider `react-query` or a custom hook to manage query parameters and data fetching efficiently.

*   **Styling (Tailwind CSS):**
    *   Apply Tailwind for table styling (`UserTable.tsx`), including borders, padding, and hover states.
    *   Style `ActivityLogEntry.tsx` to clearly distinguish individual entries, perhaps with alternating background colors or subtle borders.
    *   Ensure both tables and activity feeds are responsive, potentially using horizontal scrolling for tables on small screens.

**Checklist:**

*   [ ] (Conditional) Create `src/routes/dashboard/users.tsx`.
*   [ ] (Conditional) Create `src/components/dashboard/UserTable.tsx`.
*   [ ] Create `src/routes/dashboard/activity-log.tsx`.
*   [ ] Create `src/components/dashboard/ActivityLogEntry.tsx`.
*   [ ] Define mock data for a list of users and a list of activity log entries.
*   [ ] (Conditional) In `users.tsx`, display the mock user list using `UserTable.tsx`.
*   [ ] In `activity-log.tsx`, display the mock activity log using `ActivityLogEntry.tsx` components.
*   [ ] Ensure responsive display for `UserTable` and `ActivityLog`.
*   [ ] Write unit tests for `UserTable.tsx` (rendering, sorting/pagination interactions).
*   [ ] Write unit tests for `ActivityLogEntry.tsx` (rendering of different event types).
*   [ ] Write Playwright integration tests to verify:
    *   (Conditional) Navigation to `/dashboard/users` and basic display of the user table.
    *   Navigation to `/dashboard/activity-log` and basic display of the activity feed.
