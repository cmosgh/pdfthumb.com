import React, { useState } from "react";
import { PRICING_TIERS } from "../constants.ts"; // Added .ts
import PricingCard from "./PricingCard.tsx"; // Added .tsx

type BillingCycle = "monthly" | "annually";

const PricingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const toggleButtonStyles = (isActive: boolean) =>
    `px-6 py-2 rounded-md font-semibold transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
      isActive
        ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-md"
        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
    }`;

  return (
    <section id="pricing" data-testid="pricing-section" className="py-16 sm:py-24 bg-white dark:bg-slate-800">
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

        <div className="flex justify-center mb-10">
          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex space-x-1 shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={toggleButtonStyles(billingCycle === "monthly")}
              aria-pressed={billingCycle === "monthly"}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={toggleButtonStyles(billingCycle === "annually")}
              aria-pressed={billingCycle === "annually"}
            >
              Annually
              {PRICING_TIERS.some(
                (tier) => tier.priceYearly && tier.annualDiscountText,
              ) && (
                <span className="ml-2 px-2 py-0.5 bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200 text-xs rounded-full hidden sm:inline-block">
                  SAVE
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} billingCycle={billingCycle} />
          ))}
        </div>
        <p className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
          All prices are in USD. Custom plans available for high-volume needs.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
