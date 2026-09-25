const MS_PER_UNIT: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365.25 * 24 * 60 * 60 * 1000,
};

/**
 * Converts a jsonwebtoken duration, as the backend reports `expiresIn`
 * (JWT_EXPIRES_IN), to milliseconds. It follows the `ms` package that
 * jsonwebtoken uses: "1h", "15m", "2 days", "1.5h", and a bare number
 * ("3600") means milliseconds.
 * @param duration - The duration string from the backend
 * @returns Milliseconds, or null when the string isn't a duration
 */
export const durationToMs = (duration: string): number | null => {
  const match =
    /^(\d*\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      duration.trim(),
    );
  if (!match) return null;

  const unit = (match[2] ?? "ms").toLowerCase();
  const key = unit.startsWith("ms") || unit.startsWith("mil") ? "ms" : unit[0];
  return Number(match[1]) * MS_PER_UNIT[key];
};
