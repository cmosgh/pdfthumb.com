import React from "react";
import { CONTACT_EMAILS, CONTACT_RENDER } from "../constants.ts";
import type { ContactKind } from "../types.ts";
import { TextLink, textLinkClasses } from "./ui";

// The mailto link for a contact, or undefined while CONTACT_RENDER is "plain".
export const contactHref = (kind: ContactKind): string | undefined =>
  CONTACT_RENDER === "plain" ? undefined : `mailto:${CONTACT_EMAILS[kind]}`;

interface ContactEmailProps {
  kind: ContactKind;
  // "footer": the footer's link look, on the link or the plain text.
  // Otherwise an underlining link, and unstyled plain text.
  tone?: "footer";
}

// A contact address, rendered the way Q1 decides (CONTACT_RENDER).
const ContactEmail: React.FC<ContactEmailProps> = ({ kind, tone }) => {
  const address = CONTACT_EMAILS[kind];
  // In a narrow card the address wraps after the "@", not mid-domain.
  const [local, domain] = address.split("@");
  const text = (
    <>
      {local}@<wbr />
      {domain}
    </>
  );
  const href = contactHref(kind);
  return (
    <>
      {href ? (
        tone === "footer" ? (
          <TextLink href={href} tone="footer">
            {text}
          </TextLink>
        ) : (
          <TextLink href={href} tone="underline" className="break-words">
            {text}
          </TextLink>
        )
      ) : (
        <span
          className={
            tone === "footer" ? textLinkClasses({ tone }) : "break-words"
          }
        >
          {text}
        </span>
      )}
      {CONTACT_RENDER === "tbc" && " [TBC]"}
    </>
  );
};

export default ContactEmail;
