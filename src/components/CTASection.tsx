import React from "react";
import { ButtonLink, Container, Heading, Section, Text } from "./ui";

const CTASection: React.FC = () => {
  return (
    <Section tone="cta" className="py-16 sm:py-24">
      <Container className="text-center">
        <Heading as="h2" size="section" weight="extrabold" tone="on-accent">
          Ready to Supercharge Your PDF Workflows?
        </Heading>
        <Text
          size="lg"
          tone="on-accent-muted"
          className="mt-4 max-w-2xl mx-auto"
        >
          Integrate our PDFThumb API in minutes and elevate your application.
          Get your API key today and start building!
        </Text>
        <div className="mt-10">
          {/* API keys live in the dashboard, behind sign-in; new users get
              the Free plan. No checkout while pricing is upcoming (#71). */}
          <ButtonLink
            href="/login"
            variant="outlineWhite"
            size="lg"
            data-testid="cta-api-key"
          >
            Get Your Free API Key Now
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
};

export default CTASection;
