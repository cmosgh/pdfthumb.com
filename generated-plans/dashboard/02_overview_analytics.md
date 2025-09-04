# Phase 2: Overview & Basic Analytics

**Goal:** Implement the core overview section of the dashboard, displaying key metrics and basic usage trends to provide immediate insights to the user.

**Technical Details:**

*   **Components to Create/Update:**
    *   `src/routes/dashboard/overview.tsx`: This will be the main page component for the `/dashboard/overview` route. It will orchestrate the display of `MetricCard` and `UsageChart` components.
    *   `src/components/dashboard/MetricCard.tsx`: A reusable, visually appealing component to display a single key performance indicator (KPI). It should accept props for:
        *   `title: string` (e.g., "Total PDFs Processed")
        *   `value: string | number` (e.g., "1,234,567")
        *   `unit?: string` (e.g., "PDFs", "requests")
        *   `trend?: 'up' | 'down' | 'neutral'` (for a small icon indicating change)
        *   `trendValue?: string` (e.g., "+15% last month")
    *   `src/components/dashboard/UsageChart.tsx`: A dedicated component for rendering interactive charts. Initially, it will focus on a line chart for usage trends. It should accept props for:
        *   `data: any[]` (chart data)
        *   `labels: string[]` (x-axis labels)
        *   `title: string`
        *   `type: 'line' | 'bar' | ...` (to allow for future expansion)

*   **Data Fetching & Management:**
    *   **Mock Data:** For initial development, define static mock data structures within a file like `src/data/dashboardMocks.ts` that simulate API responses for:
        *   Overall metrics (total PDFs, total thumbnails, API usage).
        *   Time-series data for usage trends (e.g., daily counts for the last 30 days).
    *   **API Integration Strategy:** While starting with mocks, consider the future API endpoints. Example:
        *   `GET /api/dashboard/summary`: Returns overall metrics.
        *   `GET /api/dashboard/usage-trends?period=monthly`: Returns time-series usage data.
    *   **State Management for Data:**
        *   For this phase, simple `useState` and `useEffect` hooks within `overview.tsx` can manage the fetched data.
        *   **Recommendation for future:** Introduce a data fetching library like `react-query` (TanStack Query) for robust caching, revalidation, and error handling. This would involve creating custom hooks like `useDashboardSummary` and `useUsageTrends`.

*   **Data Visualization Library:**
    *   **Recommendation:** Integrate `Recharts` (or `react-chartjs-2` if preferred). Recharts is a popular, flexible, and React-friendly charting library.
    *   Install the library: `npm install recharts`.
    *   Implement `UsageChart.tsx` using `Recharts` components (e.g., `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`).

*   **Styling (Tailwind CSS):**
    *   Apply Tailwind classes to `MetricCard.tsx` for card-like appearance (background, shadow, padding, rounded corners).
    *   Use Tailwind for typography (font sizes, colors) within `MetricCard` and `UsageChart`.
    *   Ensure `UsageChart.tsx` is responsive within its container using `ResponsiveContainer` from Recharts and appropriate Tailwind width/height classes.
    *   Arrange `MetricCard` components in a responsive grid layout within `overview.tsx`.

**Checklist:**

*   [ ] Create `src/routes/dashboard/overview.tsx`.
*   [ ] Create `src/components/dashboard/MetricCard.tsx` and implement its UI based on props.
*   [ ] Create `src/components/dashboard/UsageChart.tsx`.
*   [ ] Install a charting library (e.g., `recharts`).
*   [ ] Implement a basic line chart in `UsageChart.tsx` using the chosen charting library.
*   [ ] Define mock data structures for dashboard summary metrics and usage trends.
*   [ ] In `overview.tsx`, fetch and display mock summary metrics using `MetricCard` components.
*   [ ] In `overview.tsx`, fetch and display mock usage trend data using `UsageChart`.
*   [ ] Ensure responsive layout for `MetricCard` grid and `UsageChart`.
*   [ ] Write unit tests for `MetricCard.tsx` (prop rendering, basic styling).
*   [ ] Write unit tests for `UsageChart.tsx` (data rendering, chart type).
*   [ ] Write an integration test using Playwright to navigate to `/dashboard/overview` and assert the presence of key metrics and the chart.
