import React from "react";
import { EVERY_PLAN_INCLUDES, ON_PREM, PRICING_TIERS } from "../constants.ts"; // Added .ts
import PricingCard from "./PricingCard.tsx"; // Added .tsx
import ContactEmail from "./ContactEmail.tsx";
import {
  Card,
  CheckList,
  CheckListItem,
  Container,
  Heading,
  Section,
  Text,
} from "./ui";

const PricingSection: React.FC = () => {
  return (
    <Section
      tone="surface"
      id="pricing"
      data-testid="pricing-section"
      className="py-16 sm:py-24"
    >
      <Container>
        <div className="text-center mb-12">
          <Heading as="h2" size="section" weight="extrabold" tone="heading">
            Flexible Pricing for Every Scale
          </Heading>
          <Text size="lg" tone="fg-muted" className="mt-4 max-w-xl mx-auto">
            Choose a plan that fits your needs. Start for free, then scale as
            you grow.
          </Text>
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
          <Heading
            as="h3"
            size="lg"
            weight="semibold"
            tone="heading"
            className="text-center mb-4"
          >
            Every plan includes
          </Heading>
          <CheckList className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EVERY_PLAN_INCLUDES.map((line) => (
              <CheckListItem key={line} tone="link">
                {line}
              </CheckListItem>
            ))}
          </CheckList>
        </div>
        <Card
          variant="band"
          className="mt-12 max-w-3xl mx-auto p-6 sm:p-8"
          data-testid="pricing-on-prem"
        >
          <Heading
            as="h3"
            size="xl"
            weight="bold"
            tone="heading"
            className="mb-2"
          >
            {ON_PREM.title}
          </Heading>
          <Text tone="fg-muted">{ON_PREM.text}</Text>
          <Text weight="semibold" tone="fg" className="mt-3">
            {ON_PREM.price}
          </Text>
          <Text tone="fg-muted" className="mt-3">
            Contact sales: <ContactEmail kind="sales" />
          </Text>
        </Card>
        <Text size="sm" tone="fg-subtle" className="text-center mt-12">
          Pricing is upcoming. Custom plans available for high-volume needs.
        </Text>
      </Container>
    </Section>
  );
};

export default PricingSection;
