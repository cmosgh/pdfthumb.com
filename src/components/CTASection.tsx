import React from "react";
import Button from "./Button.tsx"; // Added .tsx

const CTASection: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Ready to Supercharge Your PDF Workflows?
        </h2>
        <p className="mt-4 text-lg text-indigo-100 dark:text-indigo-200 max-w-2xl mx-auto">
          Integrate our PDFThumb API in minutes and elevate your application.
          Get your API key today and start building!
        </p>
        <div className="mt-10">
          {/* API keys live in the dashboard, behind sign-in; new users get
              the Free plan. No checkout while pricing is upcoming (#71). */}
          <Button
            href="/login"
            variant="outlineWhite"
            size="lg"
            data-testid="cta-api-key"
          >
            Get Your Free API Key Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
