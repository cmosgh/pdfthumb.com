import React from "react";
import { cx } from "./cx";
import { CopyButton } from "./CopyButton";

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
// to the <pre> (the ApiReference tab panel needs them). No copy button:
// CodeSample adds one.
export const CodeBlock: React.FC<CodeBlockProps> = ({
  className,
  children,
  ...rest
}) => (
  <pre className={cx(codeBlock, className)} {...rest}>
    <code>{children}</code>
  </pre>
);

export interface CodeSampleProps extends React.HTMLAttributes<HTMLDivElement> {
  [dataAttribute: `data-${string}`]: string | undefined;
  // The code, shown verbatim and copied by the button.
  code: string;
  // Attributes for the <pre> (a tab panel's id, role and aria-*).
  preProps?: CodeBlockProps;
}

// A CodeBlock with a copy button in its corner (#142). className and the
// other attributes go on the wrapper; preProps go on the <pre>.
export const CodeSample: React.FC<CodeSampleProps> = ({
  code,
  preProps,
  className,
  ...rest
}) => (
  <div className={cx("relative", className)} {...rest}>
    {/* pt-10 starts the code below the button (#178): the block scrolls
        sideways, so right padding wouldn't keep a long first line clear.
        It follows p-4 in the built CSS. */}
    <CodeBlock {...preProps} className={cx("pt-10", preProps?.className)}>
      {code}
    </CodeBlock>
    <CopyButton
      type="button"
      variant="code"
      text={code}
      ariaLabel="Copy code"
      copiedAriaLabel="Copied"
      className="absolute top-2 right-2"
    />
  </div>
);
