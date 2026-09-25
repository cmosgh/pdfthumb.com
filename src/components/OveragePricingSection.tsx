import React from "react";
import { PRICING_TIERS } from "../constants.ts"; // Added .ts
import type { PricingTier } from "../types.ts"; // Added .ts
import {
  Container,
  Heading,
  Section,
  TBody,
  THead,
  Table,
  TableFrame,
  Td,
  Text,
  Th,
} from "./ui";

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
    <Section tone="page" id="overage-pricing" className="py-16 sm:py-24">
      <Container>
        <div className="text-center mb-12">
          <Heading as="h2" size="section" weight="extrabold" tone="heading">
            Flexible Overages: Pay Only For What You Exceed
          </Heading>
          <Text size="lg" tone="fg-muted" className="mt-4 max-w-2xl mx-auto">
            Our plans are designed to grow with you. If you go over your monthly
            allowance, you're covered with transparent, pay-as-you-go pricing.
          </Text>
        </div>

        <div className="max-w-5xl mx-auto">
          <TableFrame variant="overage">
            <Table density="responsive">
              <THead>
                <tr>
                  <Th scope="col" className="text-left w-1/3 sm:w-1/4">
                    Feature
                  </Th>
                  {PRICING_TIERS.map((tier) => (
                    <Th key={tier.id} scope="col" className="text-center">
                      {tier.name}
                    </Th>
                  ))}
                </tr>
              </THead>
              <TBody surface>
                {overageFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <Td weight="medium" tone="fg" className="whitespace-normal">
                      {feature.name}
                    </Td>
                    {PRICING_TIERS.map((tier) => (
                      <Td
                        key={`${tier.id}-${feature.name}`}
                        tone="fg-muted"
                        className="text-center whitespace-normal"
                      >
                        {feature.getValue(tier)}
                      </Td>
                    ))}
                  </tr>
                ))}
              </TBody>
            </Table>
          </TableFrame>
        </div>
        <Text
          size="sm"
          tone="fg-subtle"
          className="text-center mt-10 max-w-2xl mx-auto"
        >
          Overage billing starts when paid plans launch. Until then, Free stops
          at 1,000 Thumbnails a month.
        </Text>
      </Container>
    </Section>
  );
};

export default OveragePricingSection;
