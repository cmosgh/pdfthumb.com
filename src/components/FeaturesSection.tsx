import React from "react";
import { FEATURE_ITEMS } from "../constants.ts"; // Added .ts
import type { FeatureItem } from "../types.ts"; // Added .ts

const FeatureCard: React.FC<FeatureItem> = ({ icon, title, description }) => (
  <div className="bg-surface-raised p-6 rounded-lg shadow-lg hover:shadow-xl shadow-elevation-deep/50 hover:shadow-elevation-deep/60 transition-shadow duration-300">
    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-accent-tint text-link mb-4">
      {/* The 'icon' prop already contains necessary size classes (h-8 w-8 from constants.ts).
          Color is inherited from this parent div's text colour (text-link)
          because the SVG icons in icons.tsx use stroke="currentColor".
      */}
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-fg mb-2">{title}</h3>
    <p className="text-fg-muted text-base">{description}</p>
  </div>
);

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-16 sm:py-24 bg-band">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-heading">
            Why Choose Our PDFThumb API?
          </h2>
          <p className="mt-4 text-lg text-fg-muted max-w-2xl mx-auto">
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

export default FeaturesSection;
