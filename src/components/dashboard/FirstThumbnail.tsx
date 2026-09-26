import React from "react";
import { useAnalyticsSummary, useApiKeys } from "@/hooks/useUsage";
import {
  Card,
  CheckList,
  CheckListItem,
  Heading,
  RouterTextLink,
} from "@/components/ui";

const DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The way to a first thumbnail, until the first successful request (#143).
// Each step ticks from what the API reports: a key in the key list, a
// request (a key's lastUsedAt, or one in the summary; failed ones count),
// and a successful request in the summary behind the chart. Hidden while
// either loads or fails, and once the chart shows a success.
export const FirstThumbnail: React.FC = () => {
  const keys = useApiKeys();
  const summary = useAnalyticsSummary(DAYS, true);
  if (!keys.data || !summary.data) return null;

  const buckets = summary.data.dailyBuckets;
  const onChart = buckets.some((b) => b.call_count - b.error_count > 0);
  // A key last used before the chart's window: not a first thumbnail
  const windowStart = Date.now() - DAYS * MS_PER_DAY;
  const usedBefore = keys.data.some(
    (key) => key.lastUsedAt && Date.parse(key.lastUsedAt) < windowStart,
  );
  if (onChart || usedBefore) return null;

  const hasKey = keys.data.length > 0;
  const requested =
    buckets.some((b) => b.call_count > 0) ||
    keys.data.some((key) => key.lastUsedAt);

  return (
    <Card
      as="section"
      variant="panel"
      className="p-6"
      data-testid="first-thumbnail"
      aria-labelledby="first-thumbnail-heading"
    >
      <Heading
        as="h2"
        id="first-thumbnail-heading"
        size="lg"
        weight="semibold"
        tone="fg-strong"
      >
        Your first thumbnail
      </Heading>
      <CheckList as="ol" className="mt-4 space-y-3">
        <Step done={hasKey}>
          {hasKey ? (
            "Create an API key"
          ) : (
            <RouterTextLink to="/dashboard/settings" weight="medium">
              Create an API key
            </RouterTextLink>
          )}
        </Step>
        <Step done={requested}>
          {requested ? (
            "Make your first request"
          ) : (
            <RouterTextLink to="/docs" hash="first-request" weight="medium">
              Make your first request
            </RouterTextLink>
          )}
        </Step>
        <Step done={false}>See it on the chart below</Step>
      </CheckList>
    </Card>
  );
};

const Step: React.FC<{ done: boolean; children: React.ReactNode }> = ({
  done,
  children,
}) => (
  <CheckListItem pending={!done}>
    <span className="sr-only">{done ? "Done: " : "To do: "}</span>
    {children}
  </CheckListItem>
);
