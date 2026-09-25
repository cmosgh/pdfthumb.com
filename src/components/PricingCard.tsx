import React from "react";
import type { PricingTier } from "../types";
import { CheckCircleIcon, InformationCircleIcon } from "./icons";
import Button from "./Button";
import ContactEmail, { contactHref } from "./ContactEmail";

interface PricingCardProps {
  tier: PricingTier;
}

const PricingCard: React.FC<PricingCardProps> = ({ tier }) => {
  const cardBaseClasses =
    "bg-surface-raised rounded-xl shadow-lg shadow-elevation-deep/50 p-8 flex flex-col h-full transition-all duration-300";
  const featuredClasses = tier.isFeatured
    ? "border-4 border-accent transform scale-105 z-10 relative"
    : "border border-line-strong";

  // The featured tier's name, price and ticks take the accent colour; the
  // others keep the text colour.
  const highlightText = tier.isFeatured ? "text-link" : "";

  const ctaHref = tier.ctaContact ? contactHref(tier.ctaContact) : undefined;
  const ctaDisabled = tier.isComingSoon || (!!tier.ctaContact && !ctaHref);
  const lines = [tier.quota, ...tier.features];

  // A word in the price slot ("Upcoming", "Custom") is wider than an
  // amount, so it gets a smaller size, smallest while four narrow cards
  // share a row (#131). The line height keeps the slot as tall as a price.
  const priceSize = /\d/.test(tier.price)
    ? "text-5xl"
    : "text-3xl lg:text-2xl xl:text-3xl leading-[3rem]";

  return (
    <div
      className={`${cardBaseClasses} ${featuredClasses} relative`}
      data-testid={`pricing-card-${tier.id}`}
    >
      {" "}
      {/* Ensure card is relative for absolute badge */}
      {tier.isFeatured && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-on-accent text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}
      {tier.isComingSoon && (
        <div className="absolute top-4 right-4 z-20">
          {" "}
          {/* Add z-20 to ensure badge is above all */}
          <span className="bg-chip text-on-accent text-xs font-semibold px-3 py-1 rounded-full uppercase flex items-center">
            <InformationCircleIcon className="h-4 w-4 mr-1" /> Soon
          </span>
        </div>
      )}
      <h3 className={`text-2xl font-bold ${highlightText} mb-2`}>
        {tier.name}
      </h3>
      {/* Three lines from lg, so the prices of a row line up. */}
      <p className="text-fg-subtle mb-1 min-h-[3rem] lg:min-h-[4.5rem]">
        {tier.description}
      </p>
      <div className="mb-6" data-testid="pricing-card-price">
        <span
          className={`${priceSize} font-extrabold whitespace-nowrap ${highlightText}`}
        >
          {tier.price}
        </span>
        {tier.priceFrequency && (
          <span className="text-fg-subtle text-lg ml-1">
            {tier.priceFrequency}
          </span>
        )}
      </div>
      <ul className="space-y-3 mb-8 flex-grow">
        {lines.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircleIcon
              className={`h-6 w-6 ${highlightText} mr-2 flex-shrink-0`}
            />
            {/* min-w-0 lets a long address wrap inside a narrow card. */}
            <span className="min-w-0 break-words text-fg-muted">
              {typeof feature === "string" ? (
                feature
              ) : (
                <>
                  {feature.text}: <ContactEmail kind={feature.contact} />
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <Button
        // A disabled button keeps "#" and swallows the click.
        // A live tier follows its ctaLink; Enterprise's button mails sales.
        href={ctaHref ?? (ctaDisabled ? "#" : tier.ctaLink)}
        variant={tier.isFeatured ? "primary" : "secondary"}
        className={`w-full mt-auto ${ctaDisabled ? "opacity-70 cursor-not-allowed" : ""}`}
        disabled={ctaDisabled}
      >
        {tier.ctaText}
      </Button>
    </div>
  );
};

export default PricingCard;
