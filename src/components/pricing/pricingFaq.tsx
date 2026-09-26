import React from "react";
import { API_LIMITS, OVERAGE_NOT_YET } from "../../constants.ts";
import { RouterTextLink } from "../ui";

// The /pricing FAQ (#141). Every answer comes from the backend
// (pdfthumbnailpro-be, "BE" below), named above it. Stay inside them: no
// "calendar month" (the Usage period runs from the plan's start date), no
// overage rates (withheld until BE #185), no claim about repeated requests
// (nothing in BE documents them).

export interface FaqEntry {
  question: string;
  answer: React.ReactNode;
}

const errorLink = (code: string) => (
  <RouterTextLink to="/docs" hash={`error-${code}`} tone="underline">
    {code}
  </RouterTextLink>
);

export const PRICING_FAQ: FaqEntry[] = [
  {
    question: "What counts as a Thumbnail?",
    // BE CONTEXT.md "Thumbnail": "One page image successfully returned to
    // the caller ... a failed render is not a Thumbnail, and a ZIP request
    // yields one Thumbnail per page rendered." "Page count lookup": "Free of
    // charge". BE src/subscription/quota-reservation.ts: a thrown 4xx or
    // our own 5xx "gives the whole reservation back".
    answer: (
      <>
        One page image we send back to you. A ZIP counts one Thumbnail for each
        page in it. A request that fails isn't counted, and asking how many
        pages a PDF has is free.
      </>
    ),
  },
  {
    question: "What happens when I reach my limit?",
    // BE src/subscription/default-subscription-types.ts: "Free has a hard
    // limit and no Overage". BE subscription-refused.exception.ts: a 403;
    // user-subscriptions.service.ts: MONTHLY_LIMIT_REACHED. BE CONTEXT.md
    // "Overage": "Never refused, always invoiced afterwards". "Usage
    // period": from one anniversary of the start date to the next, from
    // 00:00 UTC, "Free and paid plans alike". The last sentence is the
    // docs page's own wording (src/routes/docs.tsx, #126).
    answer: (
      <>
        On Free, the API stops making Thumbnails and answers 403{" "}
        {errorLink("MONTHLY_LIMIT_REACHED")} until your usage period starts
        again. Basic and Pro keep working past their quota: the extra Thumbnails
        are overage. The quota resets monthly, on the day your plan started, at
        00:00 UTC.
      </>
    ),
  },
  {
    question: "Is there overage?",
    // BE default-subscription-types.ts: Free has no Overage; Basic and Pro
    // carry a per-Thumbnail overage rate. The second sentence is M13
    // (BE docs/research/on-prem-enterprise-pricing.md), OVERAGE_NOT_YET.
    answer: <>On Basic and Pro, not on Free. {OVERAGE_NOT_YET}</>,
  },
  {
    question: "How large can a PDF be?",
    // BE src/thumbnail/upload-limit.ts: MAX_UPLOAD_MB = 10, per uploaded
    // file (plan-upload.interceptor.ts, multer fileSize); every default plan
    // takes 10 MB (default-subscription-types.ts, decision M4). Too large
    // is a 413 FILE_TOO_LARGE (plan-upload.interceptor.ts), and a thrown
    // 4xx is not counted (quota-reservation.ts).
    answer: (
      <>
        Up to {API_LIMITS.maxUploadMB} MB per PDF, on every plan. A larger file
        gets a 413 {errorLink("FILE_TOO_LARGE")} and isn't counted.
      </>
    ),
  },
];
