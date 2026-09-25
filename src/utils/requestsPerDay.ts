import type { AnalyticsDailyBucket } from "../api";

export interface DailyRequests {
  [key: string]: string | number;
  date: string; // YYYY-MM-DD, UTC
  successful: number;
  failed: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * One entry per day for the `days` days ending today (UTC), oldest first.
 * Days the API has no bucket for count as zero. A bucket's date may be
 * "YYYY-MM-DD" or a midnight timestamp, and its counts numbers or strings.
 */
export function toDailyRequests(
  buckets: AnalyticsDailyBucket[],
  days: number,
  now = new Date(),
): DailyRequests[] {
  const byDate = new Map(buckets.map((b) => [b.date.slice(0, 10), b]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * MS_PER_DAY)
      .toISOString()
      .slice(0, 10);
    const bucket = byDate.get(date);
    const total = Number(bucket?.call_count ?? 0);
    const failed = Number(bucket?.error_count ?? 0);
    return { date, successful: total - failed, failed };
  });
}

// "Sep 25" for a YYYY-MM-DD day, read in UTC so it doesn't shift a day
export function formatDay(date: string, long = false) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-US",
    long
      ? { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }
      : { month: "short", day: "numeric", timeZone: "UTC" },
  );
}
