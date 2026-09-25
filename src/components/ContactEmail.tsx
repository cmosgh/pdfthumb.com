import React from "react";
import { CONTACT_EMAILS, CONTACT_RENDER } from "../constants.ts";
import type { ContactKind } from "../types.ts";

// The mailto link for a contact, or undefined while CONTACT_RENDER is "plain".
export const contactHref = (kind: ContactKind): string | undefined =>
  CONTACT_RENDER === "plain" ? undefined : `mailto:${CONTACT_EMAILS[kind]}`;

interface ContactEmailProps {
  kind: ContactKind;
  className?: string;
}

// A contact address, rendered the way Q1 decides (CONTACT_RENDER).
const ContactEmail: React.FC<ContactEmailProps> = ({ kind, className }) => {
  const address = CONTACT_EMAILS[kind];
  const href = contactHref(kind);
  return (
    <>
      {href ? (
        <a
          href={href}
          className={
            className ??
            "text-indigo-600 dark:text-indigo-400 hover:underline break-words"
          }
        >
          {address}
        </a>
      ) : (
        <span className={className ?? "break-words"}>{address}</span>
      )}
      {CONTACT_RENDER === "tbc" && " [TBC]"}
    </>
  );
};

export default ContactEmail;
