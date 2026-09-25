import React from "react";
import { Link } from "@tanstack/react-router";
import { DocumentIcon } from "./icons.tsx";
import { APP_NAME } from "../constants.ts";
import ContactEmail from "./ContactEmail.tsx";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const linkClasses = "text-fg-subtle hover:text-link text-sm";

  return (
    <footer className="bg-band border-t border-line">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link
              to="/"
              className="flex items-center space-x-2 text-link hover:text-link-hover mb-4"
            >
              <DocumentIcon className="h-8 w-8" />
              <span className="font-bold text-xl text-fg-2">{APP_NAME}</span>
            </Link>
            <p className="text-fg-subtle text-sm">
              Making PDF thumbnail generation simple and fast for developers.
            </p>
          </div>
          <div>
            <h5 className="text-fg-2 font-semibold mb-3">Quick Links</h5>
            <ul className="space-y-2">
              <li>
                <a href="/#features" className={linkClasses}>
                  Features
                </a>
              </li>
              <li>
                <a href="/#pricing" className={linkClasses}>
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  to="/docs"
                  className={linkClasses}
                  data-testid="footer-docs-link"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/status" className={linkClasses}>
                  API Status
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-fg-2 font-semibold mb-3">Legal</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className={linkClasses}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={linkClasses}>
                  Privacy Policy
                </Link>
              </li>
              <li className="text-fg-subtle text-sm">
                Contact Us:{" "}
                <ContactEmail kind="support" className={linkClasses} />
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-line pt-8 text-center">
          <p className="text-sm text-fg-subtle">
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
