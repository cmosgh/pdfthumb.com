// "1,240"
export const count = (n: number) => n.toLocaleString("en-US");

// "16 Sep", in UTC. Built by hand: en-GB now prints "Sept" for September.
export const dayMonth = (at: Date) =>
  `${at.getUTCDate()} ${at.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}`;
