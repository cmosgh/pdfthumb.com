import React from "react";
import type { BillingPeriod } from "../../utils/pricing.ts";
import { Button } from "../ui";

interface BillingPeriodToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}

const OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

// Monthly or yearly prices on /pricing (#141). Rendered only while
// SHOW_YEARLY_TOGGLE is on, which waits for the paid amounts
// (pdfthumbnailpro-be#185). It carries no discount wording of its own.
const BillingPeriodToggle: React.FC<BillingPeriodToggleProps> = ({
  value,
  onChange,
}) => (
  <div
    role="radiogroup"
    aria-label="Billing period"
    className="flex justify-center gap-2"
    data-testid="billing-period"
  >
    {OPTIONS.map((option) => (
      <Button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={value === option.value}
        variant={value === option.value ? "accent" : "neutral"}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </Button>
    ))}
  </div>
);

export default BillingPeriodToggle;
