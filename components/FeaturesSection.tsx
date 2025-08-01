import React from "react";
import { FEATURE_ITEMS } from "../constants.ts"; // Added .ts
import type { FeatureItem } from "../types.ts"; // Added .ts

const FeatureCard: React.FC<FeatureItem> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-lg hover:shadow-xl dark:shadow-slate-900/50 dark:hover:shadow-slate-800/60 transition-shadow duration-300">
    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4">
      {/* The 'icon' prop already contains necessary size classes (h-8 w-8 from constants.ts).
          Color is inherited from this parent div's text color (text-indigo-600 dark:text-indigo-400)
          because the SVG icons in icons.tsx use stroke="currentColor".
      */}
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
      {title}
    </h3>
    <p className="text-slate-600 dark:text-slate-300 text-base">
      {description}
    </p>
  </div>
);

const FeaturesSection: React.FC = () => {
  return (
    <section
      id="features"
      className="py-16 sm:py-24 bg-slate-100 dark:bg-slate-800"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">
            Why Choose Our PDF Thumbnail API?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            We provide a comprehensive solution for all your PDF thumbnail
            needs, packed with powerful features.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_ITEMS.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Styling notes for consistency:
// Body: bg-slate-50 dark:bg-slate-900
// Section (FeaturesSection, PricingSection): bg-slate-100 dark:bg-slate-800
// Card (FeatureCard, PricingCard internal): bg-white dark:bg-slate-700
// FeatureCard icon wrapper: bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400

// Shadow adjustment for FeatureCard on dark mode:
// current: dark:shadow-slate-700/50 dark:hover:shadow-slate-600/60
// updated to: dark:shadow-slate-900/50 dark:hover:shadow-slate-800/60 to be consistent with PricingCard and ensure visibility against dark:bg-slate-800 section.

export default FeaturesSection;
