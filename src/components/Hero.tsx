import React from "react";
// Removed: import { Link } from '@tanstack/react-router';
import Button from "./Button.tsx";
import { HOME_LINK } from "@/constants.ts";

const Hero: React.FC = () => {
  // Styles for the "Read Documentation" link, to make it look like a Button
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-150 ease-in-out";
  const secondaryVariantStyles =
    "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-indigo-500 dark:bg-slate-700 dark:text-indigo-300 dark:hover:bg-slate-600 dark:focus:ring-indigo-400";
  const lgSizeStyles = "px-6 py-3 text-lg";
  const hoverTransformStyles = "transform hover:scale-105";

  const docLinkClasses = `${baseStyles} ${secondaryVariantStyles} ${lgSizeStyles} ${hoverTransformStyles}`;

  return (
    <section
      id={HOME_LINK.hash}
      className="bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-800 dark:to-sky-900 py-20 md:py-32"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
          Instant{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            PDF Thumbnails
          </span>
          ,
          <br className="hidden sm:block" />
          Effortlessly via API
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300">
          Focus on your application's core features. Let our robust API handle
          fast, reliable PDF thumbnail generation at scale.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button href="#pricing" variant="primary" size="lg">
            View Pricing Plans
          </Button>
          <a
            href="#features" // Reverted: Points to features section as a placeholder for docs
            className={docLinkClasses}
          >
            Read Documentation
          </a>
        </div>
        <div className="mt-16">
          <img
            src="https://picsum.photos/seed/heroimage/800/400?grayscale&blur=1"
            alt="Abstract representation of PDF thumbnails"
            className="mx-auto rounded-lg shadow-2xl dark:shadow-slate-700/50 border-4 border-white dark:border-slate-600"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
