import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { APP_NAME } from "../constants";
import { healthApi } from "../api";
import TrustPage from "../components/trust/TrustPage";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [{ title: `API Status | ${APP_NAME}` }],
  }),
  component: StatusPage,
});

// "25 Sep 2026, 22:10 UTC", spelled out by hand: locale data varies
// between browsers (en-GB now says "Sept").
const formatCheckedAt = (at: Date) => {
  const month = at.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const time = at.toISOString().slice(11, 16);
  return `${at.getUTCDate()} ${month} ${at.getUTCFullYear()}, ${time} UTC`;
};

// The API's state right now, from its public health checks (#144). There's
// no stored history, so the page shows none: no uptime, no incidents.
function StatusPage() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const [live, ready] = await Promise.all([
        healthApi.check("live"),
        healthApi.check("ready"),
      ]);
      return { live, ready, checkedAt: new Date() };
    },
    staleTime: 0,
    retry: false,
  });

  const operational = data?.live && data?.ready;
  const row = (label: string, ok: boolean, testId: string) => (
    <li className="flex justify-between gap-4 py-2" data-testid={testId}>
      <span>{label}</span>
      <span
        className={
          ok
            ? "font-medium text-emerald-700 dark:text-emerald-400"
            : "font-medium text-rose-700 dark:text-rose-400"
        }
      >
        {ok ? "Yes" : "No"}
      </span>
    </li>
  );

  return (
    <TrustPage title="API Status">
      {!data ? (
        <p>Checking…</p>
      ) : (
        <>
          <p className="flex items-center gap-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
            <span
              aria-hidden="true"
              className={`inline-block h-3 w-3 rounded-full ${operational ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span data-testid="status-overall">
              {operational ? "Operational" : "Degraded"}
            </span>
          </p>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {row("API is running", data.live, "status-live")}
            {row("API is ready to serve requests", data.ready, "status-ready")}
          </ul>
          <p className="text-sm" data-testid="status-checked-at">
            Checked {formatCheckedAt(data.checkedAt)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60 dark:text-indigo-400"
          >
            {isFetching ? "Checking…" : "Check again"}
          </button>
        </>
      )}
    </TrustPage>
  );
}
