import React from "react";
import { PRICING_TIERS } from "../constants.ts"; // Added .ts
import type { PricingTier } from "../types.ts"; // Added .ts

const OveragePricingSection: React.FC = () => {
  // Define the features to display in the table
  const overageFeatures = [
    {
      name: "Monthly Included Thumbnails",
      getValue: (tier: PricingTier) => tier.quota,
    },
    {
      name: "Cost per Additional Thumbnail",
      getValue: (tier: PricingTier) => tier.overageRateDisplay || "-",
    },
    {
      name: "How Overages Work",
      getValue: (tier: PricingTier) =>
        tier.overageDescription || "Details not specified.",
    },
  ];

  return (
    <section id="overage-pricing" className="py-16 sm:py-24 bg-page">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-heading">
            Flexible Overages: Pay Only For What You Exceed
          </h2>
          <p className="mt-4 text-lg text-fg-muted max-w-2xl mx-auto">
            Our plans are designed to grow with you. If you go over your monthly
            allowance, you're covered with transparent, pay-as-you-go pricing.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="overflow-x-auto rounded-lg shadow-lg bg-surface border border-line">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-muted">
                <tr>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-fg-label uppercase tracking-wider w-1/3 sm:w-1/4"
                  >
                    Feature
                  </th>
                  {PRICING_TIERS.map((tier) => (
                    <th
                      key={tier.id}
                      scope="col"
                      className={`px-4 sm:px-6 py-3 text-center text-xs font-medium text-fg-label uppercase tracking-wider ${tier.isFeatured ? "font-bold" : ""}`}
                    >
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-line">
                {overageFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <td className="px-4 sm:px-6 py-4 whitespace-normal text-sm font-medium text-fg">
                      {feature.name}
                    </td>
                    {PRICING_TIERS.map((tier) => (
                      <td
                        key={`${tier.id}-${feature.name}`}
                        className="px-4 sm:px-6 py-4 text-center text-sm text-fg-muted whitespace-normal"
                      >
                        {feature.getValue(tier)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-center mt-10 text-sm text-fg-subtle max-w-2xl mx-auto">
          Overage billing starts when paid plans launch. Until then, Free stops
          at 1,000 Thumbnails a month.
        </p>
      </div>
    </section>
  );
};

export default OveragePricingSection;
