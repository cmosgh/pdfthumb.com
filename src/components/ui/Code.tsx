import React from "react";
import { cx } from "./cx";

const codeVariant = {
  // Inline code in docs prose (p, li, td).
  inline: "font-mono text-sm bg-muted px-1 rounded",
  // ApiKeysManager key identifier.
  chip: "text-xs bg-muted px-2 py-1 rounded",
  // The masked key in ApiKeyGeneratedDialog.
  key: "text-sm font-mono text-fg-strong",
} as const;

export type CodeVariant = keyof typeof codeVariant;

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CodeVariant;
}

export const Code: React.FC<CodeProps> = ({
  variant = "inline",
  className,
  ...rest
}) => <code className={cx(codeVariant[variant], className)} {...rest} />;

const codeBlock =
  "bg-code border border-code-line text-code-fg text-sm rounded-lg p-4 overflow-x-auto";

export interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  [dataAttribute: `data-${string}`]: string | undefined;
}

// A <pre><code> block. id, role, tabIndex, aria-* and data-* pass through
// to the <pre> (the ApiReference tab panel needs them). No copy button.
export const CodeBlock: React.FC<CodeBlockProps> = ({
  className,
  children,
  ...rest
}) => (
  <pre className={cx(codeBlock, className)} {...rest}>
    <code>{children}</code>
  </pre>
);
