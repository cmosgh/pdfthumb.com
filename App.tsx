
import React from 'react';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import Hero from './components/Hero.tsx';
import FeaturesSection from './components/FeaturesSection.tsx';
import PricingSection from './components/PricingSection.tsx';
import OveragePricingSection from './components/OveragePricingSection.tsx';
import CTASection from './components/CTASection.tsx';
import { useTheme } from './hooks/useTheme.ts';

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow">
        <Hero />
        <FeaturesSection />
        <PricingSection />
        <OveragePricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default App;