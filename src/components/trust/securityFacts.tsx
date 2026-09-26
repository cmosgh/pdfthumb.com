import React from "react";
import ContactEmail from "../ContactEmail";

// What /security and /subprocessors claim (#144). Every line comes from one
// of the backend's fact-checks on #144, named above it:
//   storage: issuecomment-5840242738 (files, backups, logs, location)
//   part 2:  issuecomment-5842564803 (keys, sign-in, transport, database,
//            subprocessors)
// Stay inside them. No "never stored" (ZIPs touch disk), no self-serve
// deletion, no certification, no full CSP for the site (API only).

export interface TrustSection {
  id: string;
  heading: string;
  points: React.ReactNode[];
}

export const SECURITY_UPDATED = "26 September 2026";

export const SECURITY_SECTIONS: TrustSection[] = [
  {
    id: "files",
    heading: "Your files",
    points: [
      // storage: multer memory storage; PDFium renders from the buffer.
      "The PDFs you send are held in memory while we make the thumbnails, and are never written to disk.",
      // storage: /page encodes in memory and returns.
      "A single thumbnail is made in memory and sent straight back to you.",
      // storage: /zip streams to node disk, deleted when the response
      // finishes; a janitor sweeps orphans older than 1 h.
      "A ZIP of thumbnails is written to the server's disk while it's sent to you, and deleted as soon as the response finishes. A clean-up job removes any left over for more than an hour, for example after a dropped connection.",
      // storage: libvips may spill to a disk emptyDir /tmp.
      "While rendering, our image library may use the server's scratch disk.",
      // storage: no object storage for content; the DB holds no PDFs or
      // thumbnails.
      "We keep no copies. PDFs and thumbnails aren't stored in our database, our backups or any file storage.",
    ],
  },
  {
    id: "hosting",
    heading: "Where we run",
    points: [
      // storage: all cluster nodes in Hetzner Nuremberg (nbg1).
      "The service runs on Hetzner servers in Nuremberg, Germany.",
      // storage + part 2: backups in Falkenstein, "kept on a 14-day
      // retention policy".
      "Database backups are stored with Hetzner in Falkenstein, Germany, and kept on a 14-day retention policy. The database holds your account and usage records, never your files.",
      // part 2: database safe wording.
      "The database runs inside our private cluster network and isn't reachable from the internet.",
    ],
  },
  {
    id: "transport",
    heading: "In transit",
    points: [
      // part 2: redirected; TLS 1.2 or newer; Let's Encrypt.
      "Traffic to pdfthumb is encrypted with TLS 1.2 or newer, using Let's Encrypt certificates. HTTP is redirected to HTTPS.",
      // part 2: HSTS on both hosts.
      "Browsers are told to reach us over HTTPS only (HSTS).",
      // part 2: the full header set is on the API only.
      "The API also sends a strict set of security headers, including a Content Security Policy.",
    ],
  },
  {
    id: "api-keys",
    heading: "API keys",
    points: [
      // part 2: shown once; stored as a hash plus the first and last 4
      // characters.
      "Your API key is shown in full once, when you create it. We store only a hash of it, plus its first and last four characters so you can tell your keys apart.",
      // part 2: safe wording.
      "Keys never expire on their own; revoke them any time from the dashboard.",
    ],
  },
  {
    id: "sign-in",
    heading: "Sign-in and sessions",
    points: [
      // part 2: Google only (email, profile); no passwords; only a
      // verified email is used.
      "You sign in with Google, so we hold no password of yours. We use your verified email address and your basic Google profile.",
      // part 2: access token 1 h; refresh safe wording.
      "A sign-in lasts an hour, then renews itself. The token that renews it is hashed at rest, rotated on every use, and expires after 7 days without use.",
    ],
  },
  {
    id: "logs",
    heading: "What we log",
    points: [
      // storage: method, masked URL, user-agent, route, status, duration,
      // response size.
      "Request logs record the method, the address with any secrets masked, the client's user agent, the status, how long it took and the response size.",
      // storage: no file bytes, no filenames; usage_events is metadata
      // only.
      "Neither the logs nor your usage records contain your files or their names.",
    ],
  },
  {
    id: "not-yet",
    heading: "What we don't have yet",
    points: [
      // part 2: say so plainly.
      "We don't have SOC 2 or ISO 27001 certification.",
      // part 2: database safe wording.
      "We don't currently add our own encryption at rest to the database or its backups.",
    ],
  },
  {
    id: "report",
    heading: "Reporting a problem",
    points: [
      <>
        Found a security problem? Tell us at <ContactEmail kind="support" />.
      </>,
    ],
  },
];

export interface Subprocessor {
  name: string;
  purpose: string;
  data: string;
}

export const SUBPROCESSORS_UPDATED = "26 September 2026";

// part 2: the list; storage: what Hetzner holds.
export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Hetzner Online GmbH",
    purpose:
      "Hosting (Nuremberg, Germany) and database backups (Falkenstein, Germany)",
    data: "Your files while they're processed, your account and usage records, request logs",
  },
  {
    name: "Google",
    purpose: "Sign-in with Google",
    data: "Your email address and basic profile",
  },
  {
    name: "Namecheap",
    purpose: "DNS, and forwarding of email sent to our @pdfthumb.com addresses",
    data: "Emails you send to those addresses",
  },
];

// part 2: no CDN, email-sending, analytics, error-tracking or telemetry
// SaaS. Stripe joins the table when billing goes live (#185).
export const SUBPROCESSORS_NOT_USED =
  "We use no CDN, email-sending, analytics, error-tracking or telemetry services. Billing isn't live yet; its payment provider will be listed here when it is.";
