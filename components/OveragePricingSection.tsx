
import React from 'react';
import { PRICING_TIERS } from '../constants.ts'; // Added .ts
import type { PricingTier } from '../types.ts'; // Added .ts

const OveragePricingSection: React.FC = () => {
  // Define the features to display in the table
  const overageFeatures = [
    {
      name: 'Monthly Included Thumbnails',
      // Assuming the first feature in the tier.features array is the thumbnail count
      getValue: (tier: PricingTier) => tier.features.find(f => f.toLowerCase().includes('thumbnails/month')) || (tier.id === 'enterprise' ? 'Unlimited' : 'N/A'),
    },
    {
      name: 'Cost per Additional Thumbnail',
      getValue: (tier: PricingTier) => tier.overageRateDisplay || '-',
    },
    {
      name: 'How Overages Work',
      getValue: (tier: PricingTier) => tier.overageDescription || 'Details not specified.',
    },
  ];

  return (
    <section id="overage-pricing" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">
            Flexible Overages: Pay Only For What You Exceed
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Our plans are designed to grow with you. If you go over your monthly allowance, you're covered with transparent, pay-as-you-go pricing.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="overflow-x-auto rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/3 sm:w-1/4">
                    Feature
                  </th>
                  {PRICING_TIERS.map(tier => (
                    <th 
                      key={tier.id} 
                      scope="col" 
                      className={`px-4 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider ${tier.isFeatured ? 'font-bold' : ''}`}
                    >
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {overageFeatures.map(feature => (
                  <tr key={feature.name}>
                    <td className="px-4 sm:px-6 py-4 whitespace-normal text-sm font-medium text-slate-800 dark:text-slate-100">
                      {feature.name}
                    </td>
                    {PRICING_TIERS.map(tier => (
                      <td key={`${tier.id}-${feature.name}`} className="px-4 sm:px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-300 whitespace-normal">
                        {feature.getValue(tier)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
         <p className="text-center mt-10 text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Note: Overages for Basic and Pro plans are billed automatically at the end of your monthly cycle. Developer plan users will be prompted to upgrade if limits are reached. Enterprise plan overages are subject to your specific service agreement.
          </p>
      </div>
    </section>
  );
};

export default OveragePricingSection;