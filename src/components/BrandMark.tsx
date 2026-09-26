import React from "react";
import { DocumentIcon } from "./icons.tsx";

// The brand mark beside the product name: the runtime theme's logo when it
// sets one (#138, src/theme/boot.ts), else the default document icon. Both
// logos render and CSS shows the one for the current mode, like the tokens.
const BrandMark: React.FC = () => {
  const logo = window.__PT_THEME__?.logo;
  if (!logo) return <DocumentIcon className="h-8 w-8 shrink-0" />;
  return (
    <>
      <img
        src={logo.light}
        alt=""
        className="h-8 w-8 shrink-0 dark:hidden"
        data-testid="brand-logo"
      />
      <img
        src={logo.dark}
        alt=""
        className="hidden h-8 w-8 shrink-0 dark:block"
        data-testid="brand-logo"
      />
    </>
  );
};

export default BrandMark;
