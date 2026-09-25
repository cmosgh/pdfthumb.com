import React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/api";
import { useAuth } from "@/hooks/AuthContext";
import { count, dayMonth } from "@/utils/format";

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
      <p className="mt-2 text-fg-caption" data-testid="plan-quota-error">
        Your plan couldn't be loaded. Try again later.
      </p>
    );
  } else if (isPending) {
    body = <p className="mt-2 text-fg-caption">Loading…</p>;
  } else if (!data) {
    body = (
      <p className="mt-2 text-fg-caption" data-testid="plan-quota-empty">
        You don't have a plan yet.{" "}
        <Link
          to="/"
          hash="pricing"
          className="font-medium text-link hover:text-link-hover"
        >
          See plans
        </Link>
      </p>
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
        <p className="mt-1 text-fg-2" data-testid="plan-quota-summary">
          {name} · {count(used)} of {count(limit)} Thumbnails used · resets{" "}
          {dayMonth(end)} (in {daysLeft} {daysLeft === 1 ? "day" : "days"})
        </p>
        <div
          role="progressbar"
          aria-label="Thumbnails used this period"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={shown}
          className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={`h-full rounded-full ${used >= limit ? "bg-chart-2" : "bg-chart-1"}`}
            style={{ width: `${limit > 0 ? (shown / limit) * 100 : 100}%` }}
          />
        </div>
        <p
          className="mt-3 text-sm text-fg-caption"
          data-testid="plan-quota-limit"
        >
          {isHardLimit
            ? "Hard limit: requests past the quota are refused until it resets."
            : "Past the quota, each Thumbnail is billed as overage."}
        </p>
      </>
    );
  }

  return (
    <section
      className="bg-surface rounded-lg shadow-sm border border-line p-6"
      data-testid="plan-quota"
      aria-labelledby="plan-quota-heading"
    >
      <h2
        id="plan-quota-heading"
        className="text-lg font-semibold text-fg-strong"
      >
        Plan and quota
      </h2>
      {body}
    </section>
  );
};
