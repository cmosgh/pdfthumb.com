import React, { useId, useMemo, useState } from "react";
import { PRICE_NOTE, PRICING_TIERS } from "../../constants.ts";
import { count } from "../../utils/format.ts";
import {
  cheapestPlanFor,
  priceLabel,
  selfServeTiers,
  tierAmount,
  volumeStops,
  volumeText,
  type BillingPeriod,
} from "../../utils/pricing.ts";
import ContactEmail from "../ContactEmail.tsx";
import { Card, RangeInput, Text } from "../ui";

interface VolumeSliderProps {
  period: BillingPeriod;
}

// "Thumbnails a month" (#141): pick a volume, see the cheapest self-serve
// plan that covers it and that plan's price, all from PRICING_TIERS. A
// withheld price reads "Upcoming" until the tier carries its amount. Above
// the largest quota it points to Enterprise.
const VolumeSlider: React.FC<VolumeSliderProps> = ({ period }) => {
  const id = useId();
  const stops = useMemo(() => volumeStops(PRICING_TIERS), []);
  const quotas = selfServeTiers(PRICING_TIERS).map((t) => t.monthlyQuota!);
  // Start just past the smallest quota: where Free runs out.
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      stops.findIndex((stop) => stop > quotas[0]),
    ),
  );
  const volume = stops[index];
  const plan = cheapestPlanFor(PRICING_TIERS, volume, period);
  const enterprise = PRICING_TIERS.find((t) => t.monthlyQuota === undefined);
  const amount = plan && tierAmount(plan, period);

  return (
    <Card
      variant="panel"
      className="p-6 sm:p-8 max-w-3xl mx-auto"
      data-testid="volume-slider"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Text as="label" htmlFor={id} weight="semibold" tone="fg">
          Thumbnails a month
        </Text>
        <Text as="span" size="2xl" weight="bold" tone="heading" aria-hidden>
          {count(volume)}
        </Text>
      </div>
      <RangeInput
        id={id}
        min={0}
        max={stops.length - 1}
        step={1}
        value={index}
        onChange={(event) => setIndex(Number(event.target.value))}
        aria-valuetext={volumeText(volume)}
        className="block w-full mt-4"
      />
      <div className="flex justify-between mt-1" aria-hidden>
        <Text as="span" size="xs" tone="fg-subtle">
          {count(stops[0])}
        </Text>
        <Text as="span" size="xs" tone="fg-subtle">
          {count(stops[stops.length - 1])}
        </Text>
      </div>
      <div
        role="status"
        aria-live="polite"
        className="mt-6"
        data-testid="volume-result"
      >
        {plan ? (
          <>
            <Text tone="fg-muted">
              The cheapest plan for {volumeText(volume)}:
            </Text>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <Text
                as="span"
                size="2xl"
                weight="bold"
                tone="link"
                data-testid="volume-plan"
              >
                {plan.name}
              </Text>
              <Text
                as="span"
                size="2xl"
                weight="extrabold"
                tone="heading"
                data-testid="volume-price"
              >
                {priceLabel(plan, period)}
              </Text>
              {amount !== undefined && (
                <Text as="span" tone="fg-subtle">
                  {period === "monthly" ? "a month" : "a year"}
                </Text>
              )}
            </div>
            <Text size="sm" tone="fg-subtle" className="mt-1">
              {plan.quota} · {PRICE_NOTE}
            </Text>
          </>
        ) : (
          <>
            <Text tone="fg-muted">
              Above {volumeText(quotas[quotas.length - 1])}:
            </Text>
            <Text
              size="2xl"
              weight="bold"
              tone="link"
              className="mt-1"
              data-testid="volume-plan"
            >
              {enterprise?.name}
            </Text>
            <Text tone="fg-muted" className="mt-1 break-words">
              {enterprise?.quota}. Contact sales: <ContactEmail kind="sales" />
            </Text>
          </>
        )}
      </div>
    </Card>
  );
};

export default VolumeSlider;
