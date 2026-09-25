import React from "react";
import { EVERY_PLAN_INCLUDES, ON_PREM, PRICING_TIERS } from "../constants.ts"; // Added .ts
import PricingCard from "./PricingCard.tsx"; // Added .tsx
import ContactEmail from "./ContactEmail.tsx";
import { CheckCircleIcon } from "./icons.tsx";

const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      data-testid="pricing-section"
      className="py-16 sm:py-24 bg-surface"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-heading">
            Flexible Pricing for Every Scale
          </h2>
          <p className="mt-4 text-lg text-fg-muted max-w-xl mx-auto">
            Choose a plan that fits your needs. Start for free, then scale as
            you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>
        <div
          className="mt-12 max-w-3xl mx-auto"
          data-testid="pricing-every-plan"
        >
          <h3 className="text-lg font-semibold text-heading text-center mb-4">
            Every plan includes
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EVERY_PLAN_INCLUDES.map((line) => (
              <li key={line} className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-link mr-2 flex-shrink-0" />
                <span className="text-fg-muted">{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className="mt-12 max-w-3xl mx-auto rounded-xl border border-line-strong bg-muted p-6 sm:p-8"
          data-testid="pricing-on-prem"
        >
          <h3 className="text-xl font-bold text-heading mb-2">
            {ON_PREM.title}
          </h3>
          <p className="text-fg-muted">{ON_PREM.text}</p>
          <p className="mt-3 font-semibold text-fg">{ON_PREM.price}</p>
          <p className="mt-3 text-fg-muted">
            Contact sales: <ContactEmail kind="sales" />
          </p>
        </div>
        <p className="text-center mt-12 text-sm text-fg-subtle">
          Pricing is upcoming. Custom plans available for high-volume needs.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
