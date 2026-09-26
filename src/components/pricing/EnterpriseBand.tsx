import React from "react";
import { ON_PREM } from "../../constants.ts";
import type { PricingTier } from "../../types.ts";
import { priceLabel } from "../../utils/pricing.ts";
import ContactEmail, { contactHref } from "../ContactEmail.tsx";
import {
  ButtonLink,
  Card,
  CheckList,
  CheckListItem,
  Container,
  Heading,
  Section,
  Text,
} from "../ui";

interface EnterpriseBandProps {
  // The tiers without a self-serve quota (Enterprise).
  tiers: PricingTier[];
}

// Enterprise and the On-prem edition, in their own band below the
// self-serve cards (#141): both are arranged with sales.
const EnterpriseBand: React.FC<EnterpriseBandProps> = ({ tiers }) => (
  <Section tone="band" className="py-16" data-testid="pricing-band">
    <Container>
      <div className="text-center mb-10">
        <Heading as="h2" size="3xl" weight="bold" tone="heading">
          Larger volumes and your own infrastructure
        </Heading>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {tiers.map((tier) => {
          const href = tier.ctaContact
            ? contactHref(tier.ctaContact)
            : undefined;
          return (
            <Card
              key={tier.id}
              variant="band"
              className="p-6 sm:p-8 flex flex-col min-w-0"
              data-testid={`pricing-card-${tier.id}`}
            >
              <Heading
                as="h3"
                size="xl"
                weight="bold"
                tone="heading"
                className="mb-2"
              >
                {tier.name}
              </Heading>
              <Text tone="fg-muted">{tier.description}</Text>
              <Text
                weight="semibold"
                tone="fg"
                className="mt-3"
                data-testid="pricing-card-price"
              >
                {priceLabel(tier)}
              </Text>
              <CheckList className="space-y-3 mt-4 mb-6 flex-grow">
                {[tier.quota, ...tier.features].map((feature, index) => (
                  <CheckListItem
                    key={index}
                    tone="link"
                    textClassName="min-w-0 break-words"
                  >
                    {typeof feature === "string" ? (
                      feature
                    ) : (
                      <>
                        {feature.text}: <ContactEmail kind={feature.contact} />
                      </>
                    )}
                  </CheckListItem>
                ))}
              </CheckList>
              <ButtonLink
                // Mails sales; with no address to link, it stays disabled.
                href={href ?? "#"}
                variant="secondary"
                disabledLook="soft"
                disabled={!href}
                className="w-full sm:w-auto sm:self-start"
              >
                {tier.ctaText}
              </ButtonLink>
            </Card>
          );
        })}
        <Card
          variant="band"
          className="p-6 sm:p-8 min-w-0"
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
          <Text tone="fg-muted" className="mt-3 break-words">
            Contact sales: <ContactEmail kind="sales" />
          </Text>
        </Card>
      </div>
    </Container>
  </Section>
);

export default EnterpriseBand;
