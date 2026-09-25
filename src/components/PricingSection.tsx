import React from "react";
import { PRICING_TIERS } from "../constants.ts"; // Added .ts
import PricingCard from "./PricingCard.tsx"; // Added .tsx

const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      data-testid="pricing-section"
      className="py-16 sm:py-24 bg-white dark:bg-slate-800"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">
            Flexible Pricing for Every Scale
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Choose a plan that fits your needs. Start for free, then scale as
            you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>
        <p className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
          Pricing is upcoming. Custom plans available for high-volume needs.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
