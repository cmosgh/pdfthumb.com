import React from "react";
import type { PricingTier } from "../types";
import { InformationCircleIcon } from "./icons";
import ContactEmail, { contactHref } from "./ContactEmail";
import {
  Badge,
  ButtonLink,
  Card,
  CheckList,
  CheckListItem,
  Heading,
  Text,
} from "./ui";

interface PricingCardProps {
  tier: PricingTier;
}

const PricingCard: React.FC<PricingCardProps> = ({ tier }) => {
  // The featured tier's name, price and ticks take the accent colour; the
  // others keep the text colour.
  const highlight = tier.isFeatured ? "link" : "inherit";

  const ctaHref = tier.ctaContact ? contactHref(tier.ctaContact) : undefined;
  const ctaDisabled = tier.isComingSoon || (!!tier.ctaContact && !ctaHref);
  const lines = [tier.quota, ...tier.features];

  // A word in the price slot ("Upcoming", "Custom") is wider than an
  // amount, so it gets a smaller size, smallest while four narrow cards
  // share a row (#131). The line height keeps the slot as tall as a price.
  const isAmount = /\d/.test(tier.price);

  return (
    <Card
      variant="pricing"
      featured={tier.isFeatured}
      className="p-8 flex flex-col h-full relative"
      data-testid={`pricing-card-${tier.id}`}
    >
      {" "}
      {/* Ensure card is relative for absolute badge */}
      {tier.isFeatured && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <Badge variant="pill">Most Popular</Badge>
        </div>
      )}
      {tier.isComingSoon && (
        <div className="absolute top-4 right-4 z-20">
          {" "}
          {/* Add z-20 to ensure badge is above all */}
          <Badge variant="chip">
            <InformationCircleIcon className="h-4 w-4 mr-1" /> Soon
          </Badge>
        </div>
      )}
      <Heading
        as="h3"
        size="2xl"
        weight="bold"
        tone={highlight}
        className="mb-2"
      >
        {tier.name}
      </Heading>
      {/* Three lines from lg, so the prices of a row line up. */}
      <Text tone="fg-subtle" className="mb-1 min-h-[3rem] lg:min-h-[4.5rem]">
        {tier.description}
      </Text>
      <div className="mb-6" data-testid="pricing-card-price">
        <Text
          as="span"
          size={isAmount ? "5xl" : "priceWord"}
          leading={isAmount ? undefined : "price"}
          weight="extrabold"
          tone={highlight}
          className="whitespace-nowrap"
        >
          {tier.price}
        </Text>
        {tier.priceFrequency && (
          <Text as="span" tone="fg-subtle" size="lg" className="ml-1">
            {tier.priceFrequency}
          </Text>
        )}
      </div>
      <CheckList className="space-y-3 mb-8 flex-grow">
        {lines.map((feature, index) => (
          // min-w-0 lets a long address wrap inside a narrow card.
          <CheckListItem
            key={index}
            tone={highlight}
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
        // A disabled button keeps "#" and swallows the click.
        // A live tier follows its ctaLink; Enterprise's button mails sales.
        href={ctaHref ?? (ctaDisabled ? "#" : tier.ctaLink)}
        variant={tier.isFeatured ? "primary" : "secondary"}
        disabledLook="soft"
        className="w-full mt-auto"
        disabled={ctaDisabled}
      >
        {tier.ctaText}
      </ButtonLink>
    </Card>
  );
};

export default PricingCard;
