import React from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api";
import { useAuth } from "@/hooks/AuthContext";
import { BarChart, Card, Heading, Text, type BarSeries } from "@/components/ui";
import { formatDay, toDailyRequests } from "@/utils/requestsPerDay";
import { count } from "@/utils/format";

const DAYS = 30;

const SERIES: BarSeries[] = [
  { key: "successful", name: "Successful", color: "chart-1" },
  { key: "failed", name: "Failed", color: "chart-2" },
];

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
    <Card
      as="section"
      variant="panel"
      className="p-6"
      data-testid="requests-per-day"
      aria-labelledby="requests-per-day-heading"
    >
      <Heading
        as="h2"
        id="requests-per-day-heading"
        size="lg"
        weight="semibold"
        tone="fg-strong"
      >
        Requests per day
      </Heading>
      {isError ? (
        <Text tone="fg-caption" className="mt-2" data-testid="requests-error">
          Requests per day couldn't be loaded. Try again later.
        </Text>
      ) : isPending ? (
        <Text tone="fg-caption" className="mt-2">
          Loading…
        </Text>
      ) : (
        <>
          <Text
            size="sm"
            tone="fg-caption"
            className="mt-1 mb-4"
            data-testid="requests-total"
          >
            {successful + failed === 0
              ? `No requests in the last ${DAYS} days.`
              : `${count(successful + failed)} requests in the last ${DAYS} days: ${count(successful)} successful, ${count(failed)} failed`}
          </Text>
          <div aria-hidden="true">
            <BarChart data={days} series={SERIES} stacked />
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
    </Card>
  );
};
