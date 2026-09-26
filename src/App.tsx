import React from "react";
import Hero from "./components/Hero.tsx";
import FeaturesSection from "./components/FeaturesSection.tsx";
import PricingSection from "./components/PricingSection.tsx";
import CTASection from "./components/CTASection.tsx";

const App: React.FC = () => {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </>
  );
};

export default App;
