import React from "react";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/api";
import { useAuth } from "@/hooks/AuthContext";
import { count, dayMonth } from "@/utils/format";
import { Card, Heading, Progress, RouterTextLink, Text } from "@/components/ui";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The plan, the Thumbnails used of its monthly quota, and when the quota
// resets (#119). The reset is the API's currentPeriodEnd, never worked out
// here.
export const PlanQuota: React.FC = () => {
  const { tokens, user } = useAuth();
  const accessToken = tokens?.accessToken;
  const userId = user?.id;
  const { data, isPending, isError } = useQuery({
    queryKey: ["subscription", userId, accessToken],
    queryFn: () => subscriptionApi.getSubscription(userId!, accessToken),
    enabled: !!accessToken && !!userId,
    // On load and on focus, at most about once a minute
    staleTime: 60_000,
    retry: 1,
  });

  let body: React.ReactNode;
  if (isError) {
    body = (
      <Text tone="fg-caption" className="mt-2" data-testid="plan-quota-error">
        Your plan couldn't be loaded. Try again later.
      </Text>
    );
  } else if (isPending) {
    body = (
      <Text tone="fg-caption" className="mt-2">
        Loading…
      </Text>
    );
  } else if (!data) {
    body = (
      <Text tone="fg-caption" className="mt-2" data-testid="plan-quota-empty">
        You don't have a plan yet.{" "}
        <RouterTextLink to="/" hash="pricing" weight="medium">
          See plans
        </RouterTextLink>
      </Text>
    );
  } else {
    const {
      name,
      monthlyThumbnailLimit: limit,
      isHardLimit,
    } = data.subscriptionType;
    const used = data.currentMonthlyUsage;
    const end = new Date(data.currentPeriodEnd);
    const daysLeft = Math.max(
      0,
      Math.ceil((end.getTime() - Date.now()) / MS_PER_DAY),
    );
    const shown = Math.min(used, limit);
    body = (
      <>
        <Text tone="fg-2" className="mt-1" data-testid="plan-quota-summary">
          {name} · {count(used)} of {count(limit)} Thumbnails used · resets{" "}
          {dayMonth(end)} (in {daysLeft} {daysLeft === 1 ? "day" : "days"})
        </Text>
        <Progress
          percent={limit > 0 ? (shown / limit) * 100 : 100}
          tone={used >= limit ? "chart-2" : "chart-1"}
          aria-label="Thumbnails used this period"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={shown}
          className="mt-4"
        />
        <Text
          size="sm"
          tone="fg-caption"
          className="mt-3"
          data-testid="plan-quota-limit"
        >
          {isHardLimit
            ? "Hard limit: requests past the quota are refused until it resets."
            : "Past the quota, each Thumbnail is billed as overage."}
        </Text>
      </>
    );
  }

  return (
    <Card
      as="section"
      variant="panel"
      className="p-6"
      data-testid="plan-quota"
      aria-labelledby="plan-quota-heading"
    >
      <Heading
        as="h2"
        id="plan-quota-heading"
        size="lg"
        weight="semibold"
        tone="fg-strong"
      >
        Plan and quota
      </Heading>
      {body}
    </Card>
  );
};
