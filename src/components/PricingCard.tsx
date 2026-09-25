import React from "react";
import type { PricingTier } from "../types";
import { CheckCircleIcon, InformationCircleIcon } from "./icons";
import Button from "./Button";

interface PricingCardProps {
  tier: PricingTier;
}

const PricingCard: React.FC<PricingCardProps> = ({ tier }) => {
  const cardBaseClasses =
    "bg-white dark:bg-slate-700 rounded-xl shadow-lg dark:shadow-slate-900/50 p-8 flex flex-col h-full transition-all duration-300";
  const featuredBorderColor = tier.highlightColor
    ? tier.highlightColor.replace("bg-", "border-")
    : "border-indigo-600";
  const darkFeaturedBorderColor = tier.highlightColor
    ? tier.highlightColor.replace("bg-", "dark:border-")
    : "dark:border-indigo-500";

  const featuredClasses = tier.isFeatured
    ? `border-4 ${featuredBorderColor} ${darkFeaturedBorderColor} transform scale-105 z-10 relative`
    : "border border-slate-200 dark:border-slate-600";

  const highlightTextColorClass = tier.highlightColor
    ? `${tier.highlightColor.replace("bg-", "text-")} dark:${tier.highlightColor.replace("bg-", "text-").replace("-500", "-400").replace("-600", "-400").replace("-700", "-500")}`
    : "text-slate-800 dark:text-slate-100";

  const featuredBadgeBg = tier.highlightColor || "bg-indigo-600";
  const featuredBadgeText = "text-white";

  return (
    <div
      className={`${cardBaseClasses} ${featuredClasses} relative`}
      data-testid={`pricing-card-${tier.id}`}
    >
      {" "}
      {/* Ensure card is relative for absolute badge */}
      {tier.isFeatured && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <span
            className={`${featuredBadgeBg} ${featuredBadgeText} text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider`}
          >
            Most Popular
          </span>
        </div>
      )}
      {tier.isComingSoon && (
        <div className="absolute top-4 right-4 z-20">
          {" "}
          {/* Add z-20 to ensure badge is above all */}
          <span className="bg-slate-500 dark:bg-slate-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase flex items-center">
            <InformationCircleIcon className="h-4 w-4 mr-1" /> Soon
          </span>
        </div>
      )}
      <h3 className={`text-2xl font-bold ${highlightTextColorClass} mb-2`}>
        {tier.name}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-1 h-12 min-h-[3rem]">
        {tier.description}
      </p>
      <div className="mb-6" data-testid="pricing-card-price">
        <span className={`text-5xl font-extrabold ${highlightTextColorClass}`}>
          {tier.price}
        </span>
        {tier.priceFrequency && (
          <span className="text-slate-500 dark:text-slate-400 text-lg ml-1">
            {tier.priceFrequency}
          </span>
        )}
      </div>
      <ul className="space-y-3 mb-8 flex-grow">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircleIcon
              className={`h-6 w-6 ${highlightTextColorClass.split(" ")[0]} ${highlightTextColorClass.split(" ")[1] || ""} mr-2 flex-shrink-0`}
            />
            <span className="text-slate-600 dark:text-slate-300">
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <Button
        // Every tier is coming soon, so the disabled button swallows the click.
        // A tier that launches needs a real ctaLink here, or it links to "#".
        href={tier.id === "enterprise" ? tier.ctaLink : "#"}
        variant={tier.isFeatured ? "primary" : "secondary"}
        className={`w-full mt-auto ${tier.isComingSoon ? "opacity-70 cursor-not-allowed" : ""} 
                    ${
                      tier.isFeatured && tier.highlightColor
                        ? `${tier.highlightColor} hover:${tier.highlightColor?.replace("500", "600").replace("600", "700").replace("700", "800")} 
                                                              dark:${tier.highlightColor.replace("bg-", "bg-").replace("500", "400").replace("600", "500")} 
                                                              dark:hover:${tier.highlightColor.replace("bg-", "bg-").replace("500", "500").replace("600", "600")}`
                        : ""
                    }
                   `}
        disabled={tier.isComingSoon}
      >
        {tier.ctaText}
      </Button>
    </div>
  );
};

export default PricingCard;
