import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { APP_NAME } from "../constants";
import { healthApi } from "../api";
import { dayMonth } from "../utils/format";
import TrustPage from "../components/trust/TrustPage";
import { DividedList, Dot, Text, TextButton } from "../components/ui";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [{ title: `API Status | ${APP_NAME}` }],
  }),
  component: StatusPage,
});

// "25 Sep 2026, 22:10 UTC", spelled out by hand: locale data varies
// between browsers (en-GB now says "Sept").
const formatCheckedAt = (at: Date) => {
  const time = at.toISOString().slice(11, 16);
  return `${dayMonth(at)} ${at.getUTCFullYear()}, ${time} UTC`;
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
      <Text as="span" weight="medium" tone={ok ? "success-fg" : "danger-fg"}>
        {ok ? "Yes" : "No"}
      </Text>
    </li>
  );

  return (
    <TrustPage title="API Status">
      {!data ? (
        <p>Checking…</p>
      ) : (
        <>
          <Text
            size="2xl"
            weight="semibold"
            tone="fg"
            className="flex items-center gap-3"
          >
            <Dot
              aria-hidden="true"
              tone={operational ? "success" : "warning"}
            />
            <span data-testid="status-overall">
              {operational ? "Operational" : "Degraded"}
            </span>
          </Text>
          <DividedList>
            {row("API is running", data.live, "status-live")}
            {row("API is ready to serve requests", data.ready, "status-ready")}
          </DividedList>
          <Text size="sm" data-testid="status-checked-at">
            Checked {formatCheckedAt(data.checkedAt)}
          </Text>
          <TextButton
            type="button"
            tone="status"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Checking…" : "Check again"}
          </TextButton>
        </>
      )}
    </TrustPage>
  );
}
