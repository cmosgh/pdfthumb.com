import React from "react";
import { HOME_LINK } from "@/constants.ts";
import HeroProof from "./HeroProof.tsx";
import {
  ButtonLink,
  Container,
  Heading,
  RouterButtonLink,
  RouterTextLink,
  Section,
  Text,
} from "./ui";

const Hero: React.FC = () => {
  return (
    <Section tone="hero" id={HOME_LINK.hash} className="py-20 md:py-32">
      <Container className="text-center">
        <Heading
          as="h1"
          size="hero"
          weight="extrabold"
          tone="fg"
          leading="tight"
        >
          Instant{" "}
          <Text as="span" tone="link">
            PDF Thumbnails
          </Text>
          , <br className="hidden sm:block" />
          Effortlessly via API
        </Heading>
        {/* Decided wording (#140), within BE's fact-check on #144. */}
        <Text
          size="lead"
          tone="fg-muted"
          className="mt-6 max-w-2xl mx-auto text-balance"
          data-testid="hero-subhead"
        >
          Hosted in Germany · your files are never kept
        </Text>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <ButtonLink href="#pricing" variant="primary" size="lg">
            View Pricing Plans
          </ButtonLink>
          <RouterButtonLink
            to="/docs"
            variant="secondary"
            size="lg"
            data-testid="hero-docs-link"
          >
            Read Documentation
          </RouterButtonLink>
        </div>
        <Text size="sm" tone="fg-subtle" className="mt-4">
          <RouterTextLink
            to="/security"
            tone="underline"
            data-testid="hero-security-link"
          >
            What happens to your files
          </RouterTextLink>
        </Text>
        <div className="mt-16">
          <HeroProof />
        </div>
      </Container>
    </Section>
  );
};

export default Hero;
