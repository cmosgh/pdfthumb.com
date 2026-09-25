import React from "react";
import ContactEmail from "../ContactEmail";
import TrustPage from "./TrustPage";

interface HoldingPageProps {
  title: string;
  // One plain sentence: what isn't ready yet. No invented text in its place.
  notice: string;
}

// A trust page whose text isn't ready yet says so, and where to ask (#144).
const HoldingPage: React.FC<HoldingPageProps> = ({ title, notice }) => (
  <TrustPage title={title}>
    <p data-testid="holding-page">
      {notice} Questions: <ContactEmail kind="support" />
    </p>
  </TrustPage>
);

export default HoldingPage;
