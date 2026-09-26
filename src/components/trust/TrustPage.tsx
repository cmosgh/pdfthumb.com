import React from "react";
import { Container, Heading, Text } from "../ui";

interface TrustPageProps {
  title: string;
  children: React.ReactNode;
}

// The frame every trust page shares: /terms, /privacy, /security,
// /subprocessors and /status (#144).
const TrustPage: React.FC<TrustPageProps> = ({ title, children }) => (
  <Container className="py-16 max-w-3xl" data-testid="trust-page">
    <Heading as="h1" size="page" weight="bold" tone="fg">
      {title}
    </Heading>
    <Text as="div" tone="fg-muted" className="mt-6 space-y-4">
      {children}
    </Text>
  </Container>
);

export default TrustPage;
