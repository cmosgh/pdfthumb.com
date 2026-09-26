import React from "react";
import { cx } from "@/components/ui";

// Where a followed anchor lands: under the sticky header, and on a phone
// under the docs bar too.
export const ANCHOR_OFFSET = "scroll-mt-32 lg:scroll-mt-24";

export interface DocsSectionProps {
  id: string;
  heading: React.ReactNode;
  // The code panel: beside the prose and sticky from lg up, under the
  // prose on a phone.
  panel?: React.ReactNode;
  // The prose takes the full width (a wide table).
  wide?: boolean;
  children: React.ReactNode;
  "data-testid"?: string;
}

// One /docs section in the three-pane layout (#142).
export const DocsSection: React.FC<DocsSectionProps> = ({
  id,
  heading,
  panel,
  wide = false,
  children,
  "data-testid": testId,
}) => (
  <section
    id={id}
    data-testid={testId}
    className={cx(
      "mb-16",
      ANCHOR_OFFSET,
      !wide && "lg:grid lg:grid-cols-2 lg:gap-8",
    )}
  >
    <div className="min-w-0">
      {heading}
      {children}
    </div>
    {panel && (
      <div
        data-testid="docs-code-panel"
        className="min-w-0 mt-2 lg:mt-0 lg:sticky lg:top-24 lg:self-start"
      >
        {panel}
      </div>
    )}
  </section>
);
