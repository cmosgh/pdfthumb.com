import React from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api";
import { useAuth } from "@/hooks/AuthContext";
import { BarChartComponent } from "@/components/dashboard/BarChart";
import { formatDay, toDailyRequests } from "@/utils/requestsPerDay";

const DAYS = 30;

const SERIES = [
  { key: "successful", name: "Successful", color: "#6366f1" },
  { key: "failed", name: "Failed", color: "#f43f5e" },
];

const count = (n: number) => n.toLocaleString("en-US");

// Requests to the thumbnail routes per day, successful vs failed (#119).
// A ZIP counts as one request, so these are requests, not Thumbnails.
export const RequestsPerDay: React.FC = () => {
  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken;
  const { data, isPending, isError } = useQuery({
    queryKey: ["analytics-summary", DAYS, accessToken],
    queryFn: () => analyticsApi.getSummary(DAYS, accessToken),
    enabled: !!accessToken,
    retry: 1,
  });

  const days = data ? toDailyRequests(data.dailyBuckets, DAYS) : [];
  const successful = days.reduce((sum, d) => sum + d.successful, 0);
  const failed = days.reduce((sum, d) => sum + d.failed, 0);

  return (
    <section
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6"
      data-testid="requests-per-day"
      aria-labelledby="requests-per-day-heading"
    >
      <h2
        id="requests-per-day-heading"
        className="text-lg font-semibold text-slate-900 dark:text-slate-100"
      >
        Requests per day
      </h2>
      {isError ? (
        <p
          className="mt-2 text-slate-600 dark:text-slate-400"
          data-testid="requests-error"
        >
          Requests per day couldn't be loaded. Try again later.
        </p>
      ) : isPending ? (
        <p className="mt-2 text-slate-600 dark:text-slate-400">Loading…</p>
      ) : (
        <>
          <p
            className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-400"
            data-testid="requests-total"
          >
            {successful + failed === 0
              ? `No requests in the last ${DAYS} days.`
              : `${count(successful + failed)} requests in the last ${DAYS} days: ${count(successful)} successful, ${count(failed)} failed`}
          </p>
          <div aria-hidden="true">
            <BarChartComponent data={days} series={SERIES} stacked />
          </div>
          <table className="sr-only">
            <caption>Requests per day, last {DAYS} days (UTC)</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Successful</th>
                <th scope="col">Failed</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <th scope="row">{formatDay(d.date)}</th>
                  <td>{count(d.successful)}</td>
                  <td>{count(d.failed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
};
