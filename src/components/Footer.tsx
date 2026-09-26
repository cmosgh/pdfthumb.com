import React from "react";
import BrandMark from "./BrandMark.tsx";
import { APP_NAME } from "../constants.ts";
import ContactEmail from "./ContactEmail.tsx";
import {
  Container,
  Divider,
  Heading,
  RouterTextLink,
  Surface,
  Text,
  TextLink,
} from "./ui";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Surface as="footer" tone="footer">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <RouterTextLink
              to="/"
              tone="link"
              className="flex items-center space-x-2 mb-4"
            >
              <BrandMark />
              <Text as="span" weight="bold" size="xl" tone="fg-2">
                {APP_NAME}
              </Text>
            </RouterTextLink>
            <Text tone="fg-subtle" size="sm">
              Making PDF thumbnail generation simple and fast for developers.
            </Text>
          </div>
          <div>
            <Heading as="h5" tone="fg-2" weight="semibold" className="mb-3">
              Quick Links
            </Heading>
            <ul className="space-y-2">
              <li>
                <TextLink href="/#features" tone="footer">
                  Features
                </TextLink>
              </li>
              <li>
                <TextLink href="/#pricing" tone="footer">
                  Pricing
                </TextLink>
              </li>
              <li>
                <RouterTextLink
                  to="/docs"
                  tone="footer"
                  data-testid="footer-docs-link"
                >
                  Documentation
                </RouterTextLink>
              </li>
              <li>
                <RouterTextLink to="/status" tone="footer">
                  API Status
                </RouterTextLink>
              </li>
            </ul>
          </div>
          <div>
            <Heading as="h5" tone="fg-2" weight="semibold" className="mb-3">
              Legal
            </Heading>
            <ul className="space-y-2">
              <li>
                <RouterTextLink to="/terms" tone="footer">
                  Terms of Service
                </RouterTextLink>
              </li>
              <li>
                <RouterTextLink to="/privacy" tone="footer">
                  Privacy Policy
                </RouterTextLink>
              </li>
              <Text as="li" tone="fg-subtle" size="sm">
                Contact Us: <ContactEmail kind="support" tone="footer" />
              </Text>
            </ul>
          </div>
        </div>
        <Divider className="mt-12 pt-8 text-center">
          <Text size="sm" tone="fg-subtle">
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </Text>
        </Divider>
      </Container>
    </Surface>
  );
};

export default Footer;
