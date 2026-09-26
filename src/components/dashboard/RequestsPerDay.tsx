import React from "react";
import { Card, Heading, Text, type BarSeries } from "@/components/ui";
import { useAnalyticsSummary } from "@/hooks/useUsage";
import { rangeLabel, toDailyRequests } from "@/utils/requestsPerDay";
import { count } from "@/utils/format";
import { DailyChart } from "./DailyChart";

const SERIES: BarSeries[] = [
  { key: "successful", name: "Successful", color: "chart-1" },
  { key: "failed", name: "Failed", color: "chart-2" },
];

// Requests to the thumbnail routes per day, successful vs failed (#119).
// A ZIP counts as one request, so these are requests, not Thumbnails.
export const RequestsPerDay: React.FC<{ days?: number }> = ({ days = 30 }) => {
  const { data, isPending, isError } = useAnalyticsSummary(days);

  const perDay = data ? toDailyRequests(data.dailyBuckets, days) : [];
  const successful = perDay.reduce((sum, d) => sum + d.successful, 0);
  const failed = perDay.reduce((sum, d) => sum + d.failed, 0);
  const range = rangeLabel(days);

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
              ? `No requests in the last ${range}.`
              : `${count(successful + failed)} requests in the last ${range}: ${count(successful)} successful, ${count(failed)} failed`}
          </Text>
          <DailyChart
            data={perDay}
            series={SERIES}
            stacked
            caption={`Requests per day, last ${range} (UTC)`}
          />
        </>
      )}
    </Card>
  );
};
