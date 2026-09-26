import React from "react";
import { HOME_LINK } from "@/constants.ts";
import {
  ButtonLink,
  Container,
  FramedImage,
  Heading,
  RouterButtonLink,
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
        <Text size="lead" tone="fg-muted" className="mt-6 max-w-2xl mx-auto">
          Focus on your application's core features. Let our robust API handle
          fast, reliable PDF thumbnail generation at scale.
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
        <div className="mt-16">
          <FramedImage
            src="https://picsum.photos/seed/heroimage/800/400?grayscale&blur=1"
            alt="Abstract representation of PDF thumbnails"
          />
        </div>
      </Container>
    </Section>
  );
};

export default Hero;
