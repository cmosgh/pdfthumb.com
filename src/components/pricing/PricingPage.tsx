import React, { useState } from "react";
import {
  EVERY_PLAN_INCLUDES,
  PRICE_NOTE,
  PRICING_TIERS,
  SHOW_YEARLY_TOGGLE,
} from "../../constants.ts";
import { selfServeTiers, type BillingPeriod } from "../../utils/pricing.ts";
import PricingCard from "../PricingCard.tsx";
import OveragePricingSection from "../OveragePricingSection.tsx";
import BillingPeriodToggle from "./BillingPeriodToggle.tsx";
import EnterpriseBand from "./EnterpriseBand.tsx";
import VolumeSlider from "./VolumeSlider.tsx";
import { PRICING_FAQ } from "./pricingFaq.tsx";
import {
  CheckList,
  CheckListItem,
  Container,
  Heading,
  RouterTextLink,
  Section,
  Text,
} from "../ui";

// /pricing (#141): the volume slider, the self-serve cards, Enterprise and
// On-prem in a band below them, the overage table and a short FAQ.
const PricingPage: React.FC = () => {
  // Monthly unless SHOW_YEARLY_TOGGLE is on and the visitor picks yearly.
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const selfServe = selfServeTiers(PRICING_TIERS);
  const contracted = PRICING_TIERS.filter((t) => !selfServe.includes(t));

  return (
    <div data-testid="pricing-page">
      <Section tone="surface" className="py-16 sm:py-24">
        <Container>
          <div className="text-center mb-10">
            <Heading as="h1" size="section" weight="extrabold" tone="heading">
              Pricing
            </Heading>
            <Text size="lg" tone="fg-muted" className="mt-4 max-w-xl mx-auto">
              Choose a plan that fits your needs. Start for free, then scale as
              you grow.
            </Text>
          </div>
          {SHOW_YEARLY_TOGGLE && (
            <div className="mb-8">
              <BillingPeriodToggle value={period} onChange={setPeriod} />
            </div>
          )}
          <VolumeSlider period={period} />
          <Text
            size="sm"
            tone="fg-subtle"
            className="text-center mt-12 mb-10"
            data-testid="pricing-currency-note"
          >
            Prices in {PRICE_NOTE}.
          </Text>
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-md mx-auto lg:max-w-none"
            data-testid="pricing-self-serve"
          >
            {selfServe.map((tier) => (
              <PricingCard key={tier.id} tier={tier} period={period} />
            ))}
          </div>
          <div
            className="mt-12 max-w-3xl mx-auto"
            data-testid="pricing-every-plan"
          >
            <Heading
              as="h2"
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
            <Text size="sm" tone="fg-muted" className="text-center mt-4">
              How we handle your files and account:{" "}
              <RouterTextLink
                to="/security"
                tone="underline"
                data-testid="pricing-security-link"
              >
                Security
              </RouterTextLink>
            </Text>
          </div>
          <Text size="sm" tone="fg-subtle" className="text-center mt-12">
            Pricing is upcoming. Custom plans available for high-volume needs.
          </Text>
        </Container>
      </Section>
      <EnterpriseBand tiers={contracted} />
      <OveragePricingSection />
      <Section
        tone="surface"
        id="faq"
        className="py-16 sm:py-24"
        data-testid="pricing-faq"
      >
        <Container className="max-w-3xl">
          <Heading
            as="h2"
            size="section"
            weight="extrabold"
            tone="heading"
            className="text-center mb-10"
          >
            Questions
          </Heading>
          <div className="space-y-8">
            {PRICING_FAQ.map(({ question, answer }) => (
              <div key={question}>
                <Heading as="h3" size="lg" weight="semibold" tone="fg">
                  {question}
                </Heading>
                <Text tone="fg-muted" className="mt-2 break-words">
                  {answer}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default PricingPage;
