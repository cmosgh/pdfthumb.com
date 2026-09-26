import React from "react";
import { PRICING_TIERS } from "../constants.ts";
import { selfServeTiers } from "../utils/pricing.ts";
import { Container, Heading, RouterButtonLink, Section, Text } from "./ui";

// The landing page's short pricing teaser (#141): the plans themselves live
// on /pricing.
const PricingSection: React.FC = () => {
  const [entry] = selfServeTiers(PRICING_TIERS);
  const names = PRICING_TIERS.map((tier) => tier.name).join(", ");
  return (
    <Section
      tone="surface"
      data-testid="pricing-teaser"
      className="py-16 sm:py-24"
    >
      <Container className="text-center">
        <Heading as="h2" size="section" weight="extrabold" tone="heading">
          Flexible Pricing for Every Scale
        </Heading>
        <Text size="lg" tone="fg-muted" className="mt-4 max-w-2xl mx-auto">
          Start for free with {entry.quota}, then scale as you grow. Plans:{" "}
          {names}, plus an On-prem edition.
        </Text>
        <div className="mt-8">
          <RouterButtonLink to="/pricing" variant="primary" size="lg">
            See plans and pricing
          </RouterButtonLink>
        </div>
      </Container>
    </Section>
  );
};

export default PricingSection;
