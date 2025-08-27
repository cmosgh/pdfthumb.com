import React from "react";
// Removed: import { Link } from '@tanstack/react-router';
import { DocumentIcon } from "./icons.tsx";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const linkClasses =
    "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm";

  return (
    <footer className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <a
              href="#"
              className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-500 mb-4"
            >
              <DocumentIcon className="h-8 w-8" />
              <span className="font-bold text-xl text-slate-700 dark:text-slate-200">
                PDFThumb.io
              </span>
            </a>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Making PDF thumbnail generation simple and fast for developers.
            </p>
          </div>
          <div>
            <h5 className="text-slate-700 dark:text-slate-200 font-semibold mb-3">
              Quick Links
            </h5>
            <ul className="space-y-2">
              <li>
                <a href="#features" className={linkClasses}>
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className={linkClasses}>
                  Pricing
                </a>
              </li>
              <li>
                <a href="#features" className={linkClasses}>
                  Documentation
                </a>
              </li>
              <li>
                <a href="#apistatus" className={linkClasses}>
                  API Status
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-slate-700 dark:text-slate-200 font-semibold mb-3">
              Legal
            </h5>
            <ul className="space-y-2">
              <li>
                <a href="#terms" className={linkClasses}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#privacy" className={linkClasses}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#contact" className={linkClasses}>
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {currentYear} PDFThumb.io. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
