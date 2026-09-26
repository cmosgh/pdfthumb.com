import type { AnalyticsDailyBucket } from "../api";

export interface DailyRequests {
  [key: string]: string | number;
  date: string; // YYYY-MM-DD, UTC
  successful: number;
  failed: number;
}

export interface DailyThumbnails {
  [key: string]: string | number;
  date: string;
  page: number;
  zip: number;
}

export interface DailyResponseTimes {
  [key: string]: string | number | null;
  date: string;
  p50: number | null;
  p95: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * One entry per day for the `days` days ending today (UTC), oldest first,
 * with the API's bucket for that day if it has one.
 */
function fillDays(
  buckets: AnalyticsDailyBucket[],
  days: number,
  now: Date,
): { date: string; bucket?: AnalyticsDailyBucket }[] {
  const byDate = new Map(buckets.map((b) => [b.date, b]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * MS_PER_DAY)
      .toISOString()
      .slice(0, 10);
    return { date, bucket: byDate.get(date) };
  });
}

// Requests per day; days the API has no bucket for count as zero.
export function toDailyRequests(
  buckets: AnalyticsDailyBucket[],
  days: number,
  now = new Date(),
): DailyRequests[] {
  return fillDays(buckets, days, now).map(({ date, bucket }) => {
    const total = bucket?.call_count ?? 0;
    const failed = bucket?.error_count ?? 0;
    return { date, successful: total - failed, failed };
  });
}

// Thumbnails per day, from page requests and from ZIPs; zero-filled.
export function toDailyThumbnails(
  buckets: AnalyticsDailyBucket[],
  days: number,
  now = new Date(),
): DailyThumbnails[] {
  return fillDays(buckets, days, now).map(({ date, bucket }) => ({
    date,
    page: bucket?.thumbnails_page ?? 0,
    zip: bucket?.thumbnails_zip ?? 0,
  }));
}

// p50 and p95 per day in ms; null on days without requests, not zero.
export function toDailyResponseTimes(
  buckets: AnalyticsDailyBucket[],
  days: number,
  now = new Date(),
): DailyResponseTimes[] {
  return fillDays(buckets, days, now).map(({ date, bucket }) => ({
    date,
    p50: bucket?.p50_duration_ms ?? null,
    p95: bucket?.p95_duration_ms ?? null,
  }));
}

// "30 days", or "13 months" for the longest range
export function rangeLabel(days: number) {
  return days === 395 ? "13 months" : `${days} days`;
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
