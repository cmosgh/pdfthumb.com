import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { analyticsApi } from "@/api";
import { PlanQuota } from "@/components/dashboard/PlanQuota";
import { RequestsPerDay } from "@/components/dashboard/RequestsPerDay";
import {
  FailuresByReason,
  ProAnalyticsLocked,
  ResponseTimes,
  ThumbnailsPerDay,
  UsageByKey,
} from "@/components/dashboard/UsageDetails";
import { APP_NAME } from "@/constants";
import { useAuth } from "@/hooks/AuthContext";
import { useAnalyticsPro } from "@/hooks/useUsage";
import { Button, Heading, Tabs, Text } from "@/components/ui";

export const Route = createFileRoute("/dashboard/usage")({
  head: () => ({
    meta: [{ title: `Usage | ${APP_NAME}` }],
  }),
  component: UsageComponent,
});

// Pro Analytics' history ranges; every plan gets the last 30 days
const RANGES = [
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "395", label: "13 months" },
] as const;

type Range = (typeof RANGES)[number]["id"];

// Only what the API records about the caller's own requests: never file
// names, IPs or geography (#120).
function UsageComponent() {
  const pro = useAnalyticsPro();
  const [range, setRange] = useState<Range>("30");
  const days = pro ? Number(range) : 30;

  const panels = (
    <div className="space-y-6">
      <RequestsPerDay days={days} />
      <ThumbnailsPerDay days={days} />
      {pro && <ResponseTimes days={days} />}
      <UsageByKey days={days} />
      <FailuresByReason days={days} />
    </div>
  );

  return (
    <div className="space-y-6">
      <Heading as="h1" size="3xl" weight="bold" tone="fg">
        Usage
      </Heading>
      <PlanQuota overage />
      {pro ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Tabs
              items={RANGES}
              value={range}
              onChange={setRange}
              idFor={(id) => `usage-range-${id}`}
              panelId="usage-range-panel"
              label="History"
            />
            <CsvExport days={days} />
          </div>
          <div
            id="usage-range-panel"
            role="tabpanel"
            aria-labelledby={`usage-range-${range}`}
          >
            {panels}
          </div>
        </>
      ) : (
        <>
          {panels}
          <ProAnalyticsLocked />
        </>
      )}
    </div>
  );
}

// Downloads the range as CSV. The export needs the bearer header, so it's
// fetched and handed to the browser as a file.
const CsvExport: React.FC<{ days: number }> = ({ days }) => {
  const { tokens } = useAuth();
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  const download = async () => {
    setState("busy");
    try {
      const blob = await analyticsApi.exportCsv(days, tokens?.accessToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pdfthumb-usage-${days}-days.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="flex items-center gap-3">
      {state === "failed" && (
        <Text size="sm" tone="danger-fg" role="alert">
          The export failed. Try again.
        </Text>
      )}
      <Button variant="neutral" onClick={download} disabled={state === "busy"}>
        Download CSV
      </Button>
    </div>
  );
};
