import React from "react";
import type { AnalyticsSummary } from "@/api";
import { ERROR_CODES } from "@/docs/apiReference";
import { useAnalyticsSummary, useApiKeyNames } from "@/hooks/useUsage";
import {
  Code,
  Card,
  Heading,
  RouterTextLink,
  Table,
  TableFrame,
  TBody,
  Td,
  Text,
  Th,
  THead,
  type BarSeries,
} from "@/components/ui";
import {
  rangeLabel,
  toDailyResponseTimes,
  toDailyThumbnails,
} from "@/utils/requestsPerDay";
import { count, dayMonth } from "@/utils/format";
import { DailyChart } from "./DailyChart";

// The Usage page's panels beyond Overview's (#120). Each reads the same
// summary query as RequestsPerDay, so the page makes one request per range.

interface PanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ id, title, children }) => (
  <Card
    as="section"
    variant="panel"
    className="p-6"
    data-testid={id}
    aria-labelledby={`${id}-heading`}
  >
    <Heading
      as="h2"
      id={`${id}-heading`}
      size="lg"
      weight="semibold"
      tone="fg-strong"
    >
      {title}
    </Heading>
    {children}
  </Card>
);

// The summary for `days`, or the loading and error states in its place
const WithSummary: React.FC<{
  days: number;
  children: (summary: AnalyticsSummary) => React.ReactNode;
}> = ({ days, children }) => {
  const { data, isPending, isError } = useAnalyticsSummary(days);
  if (isError)
    return (
      <Text tone="fg-caption" className="mt-2">
        Usage couldn't be loaded. Try again later.
      </Text>
    );
  if (isPending)
    return (
      <Text tone="fg-caption" className="mt-2">
        Loading…
      </Text>
    );
  return <>{children(data)}</>;
};

const THUMBNAIL_SERIES: BarSeries[] = [
  { key: "page", name: "Page requests", color: "chart-1" },
  { key: "zip", name: "ZIPs", color: "chart-2" },
];

// Thumbnails rendered per day: one per page request, one per page in a ZIP
export const ThumbnailsPerDay: React.FC<{ days: number }> = ({ days }) => (
  <Panel id="thumbnails-per-day" title="Thumbnails per day">
    <WithSummary days={days}>
      {({ dailyBuckets }) => {
        const perDay = toDailyThumbnails(dailyBuckets, days);
        const page = perDay.reduce((sum, d) => sum + d.page, 0);
        const zip = perDay.reduce((sum, d) => sum + d.zip, 0);
        const range = rangeLabel(days);
        return (
          <>
            <Text
              size="sm"
              tone="fg-caption"
              className="mt-1 mb-4"
              data-testid="thumbnails-total"
            >
              {page + zip === 0
                ? `No Thumbnails in the last ${range}.`
                : `${count(page + zip)} Thumbnails in the last ${range}: ${count(page)} from page requests, ${count(zip)} from ZIPs`}
            </Text>
            <DailyChart
              data={perDay}
              series={THUMBNAIL_SERIES}
              stacked
              caption={`Thumbnails per day, last ${range} (UTC)`}
            />
          </>
        );
      }}
    </WithSummary>
  </Panel>
);

// Requests per API key, busiest first. Only the caller's own keys.
export const UsageByKey: React.FC<{ days: number }> = ({ days }) => {
  const names = useApiKeyNames();
  const keyName = (id: string | null) => {
    if (id === null) return "No API key";
    if (names.data) return names.data.get(id) ?? "Deleted key";
    return `Key ${id.slice(0, 8)}`;
  };
  return (
    <Panel id="usage-by-key" title="Usage per API key">
      <WithSummary days={days}>
        {({ byApiKey = [] }) =>
          byApiKey.length === 0 ? (
            <Text tone="fg-caption" className="mt-2">
              No requests in the last {rangeLabel(days)}.
            </Text>
          ) : (
            <TableFrame variant="plain" className="mt-4">
              <Table density="compact">
                <THead>
                  <tr>
                    <Th className="text-left">Key</Th>
                    <Th className="text-right">Requests</Th>
                    <Th className="text-right">Failed</Th>
                    <Th className="text-right">Last used</Th>
                  </tr>
                </THead>
                <TBody>
                  {byApiKey.map((row) => (
                    <tr key={row.apiKeyId ?? "none"}>
                      <Td rowHeader tone="fg-strong" className="text-left">
                        {keyName(row.apiKeyId)}
                      </Td>
                      <Td tone="fg-muted" className="text-right">
                        {count(row.requests)}
                      </Td>
                      <Td tone="fg-muted" className="text-right">
                        {count(row.failures)}
                      </Td>
                      <Td tone="fg-muted" className="text-right">
                        {dayMonth(new Date(row.lastUsedAt))}
                      </Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </TableFrame>
          )
        }
      </WithSummary>
    </Panel>
  );
};

const DOCUMENTED = new Map(ERROR_CODES.map((e) => [e.code as string, e]));

// Failed requests by error code, most frequent first, each linked to its
// row in the docs
export const FailuresByReason: React.FC<{ days: number }> = ({ days }) => (
  <Panel id="failures-by-reason" title="Failures by reason">
    <WithSummary days={days}>
      {({ failuresByCode = [] }) =>
        failuresByCode.length === 0 ? (
          <Text tone="fg-caption" className="mt-2">
            No failed requests in the last {rangeLabel(days)}.
          </Text>
        ) : (
          <TableFrame variant="plain" className="mt-4">
            <Table density="compact">
              <THead>
                <tr>
                  <Th className="text-left">Code</Th>
                  <Th className="text-left">Status</Th>
                  <Th className="text-left">Meaning</Th>
                  <Th className="text-right">Failed</Th>
                </tr>
              </THead>
              <TBody>
                {failuresByCode.map((row) => {
                  const doc = row.code ? DOCUMENTED.get(row.code) : undefined;
                  return (
                    <tr key={row.code ?? "none"}>
                      <Td rowHeader className="text-left align-top">
                        {doc ? (
                          <RouterTextLink to="/docs" hash={`error-${doc.code}`}>
                            <Code>{doc.code}</Code>
                          </RouterTextLink>
                        ) : row.code && row.code !== "UNKNOWN" ? (
                          <Code>{row.code}</Code>
                        ) : (
                          "Unknown"
                        )}
                      </Td>
                      <Td tone="fg-muted" className="text-left align-top">
                        {doc ? doc.statuses.join(", ") : "–"}
                      </Td>
                      <Td tone="fg-muted" className="text-left align-top">
                        {doc?.meaning ?? "Not recorded."}
                      </Td>
                      <Td tone="fg-muted" className="text-right align-top">
                        {count(row.count)}
                      </Td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          </TableFrame>
        )
      }
    </WithSummary>
  </Panel>
);

const TIME_SERIES: BarSeries[] = [
  { key: "p50", name: "p50 (ms)", color: "chart-1" },
  { key: "p95", name: "p95 (ms)", color: "chart-2" },
];

// Pro Analytics: median and 95th percentile response time per day
export const ResponseTimes: React.FC<{ days: number }> = ({ days }) => (
  <Panel id="response-times" title="Response times">
    <WithSummary days={days}>
      {({ dailyBuckets }) => (
        <>
          <Text size="sm" tone="fg-caption" className="mt-1 mb-4">
            Half of requests finish within p50, and 95 in 100 within p95.
          </Text>
          <DailyChart
            data={toDailyResponseTimes(dailyBuckets, days)}
            series={TIME_SERIES}
            caption={`Response times per day in ms, last ${rangeLabel(days)} (UTC)`}
          />
        </>
      )}
    </WithSummary>
  </Panel>
);

// What Pro Analytics adds, shown locked on lower plans rather than hidden
export const ProAnalyticsLocked: React.FC = () => (
  <Panel id="pro-analytics-locked" title="Pro Analytics">
    <Text tone="fg-2" className="mt-1">
      Included with the Pro plan:
    </Text>
    <Text as="ul" list="disc" tone="fg-2" className="mt-2 pl-5 space-y-1">
      <li>p50 and p95 response times</li>
      <li>History up to 13 months</li>
      <li>CSV export</li>
    </Text>
    <Text size="sm" tone="fg-caption" className="mt-4">
      <RouterTextLink to="/pricing" weight="medium">
        See plans
      </RouterTextLink>
    </Text>
  </Panel>
);
