import React from "react";
import { FEATURE_ITEMS } from "../constants.ts"; // Added .ts
import type { FeatureItem } from "../types.ts"; // Added .ts
import { Card, Container, Heading, IconTile, Section, Text } from "./ui";

const FeatureCard: React.FC<FeatureItem> = ({ icon, title, description }) => (
  <Card variant="feature" className="p-6">
    <IconTile className="mb-4">
      {/* The 'icon' prop already contains necessary size classes (h-8 w-8 from constants.ts).
          Color is inherited from the tile's text colour (text-link)
          because the SVG icons in icons.tsx use stroke="currentColor".
      */}
      {icon}
    </IconTile>
    <Heading as="h3" size="xl" weight="semibold" tone="fg" className="mb-2">
      {title}
    </Heading>
    <Text tone="fg-muted" size="base">
      {description}
    </Text>
  </Card>
);

const FeaturesSection: React.FC = () => {
  return (
    <Section tone="band" id="features" className="py-16 sm:py-24">
      <Container>
        <div className="text-center mb-12">
          <Heading as="h2" size="section" weight="extrabold" tone="heading">
            Why Choose Our PDFThumb API?
          </Heading>
          <Text size="lg" tone="fg-muted" className="mt-4 max-w-2xl mx-auto">
            We provide a comprehensive solution for all your PDF thumbnail
            needs, packed with powerful features.
          </Text>
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
      </Container>
    </Section>
  );
};

export default FeaturesSection;
