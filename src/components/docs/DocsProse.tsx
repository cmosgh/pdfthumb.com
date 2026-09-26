import React from "react";
import type { Block, Span } from "@/docs/content.ts";
import { Code, RouterTextLink, Text, TextLink } from "@/components/ui";

// Renders the docs content (src/docs/content.ts) as the page shows it.

export const Spans: React.FC<{ spans: Span[] }> = ({ spans }) => (
  <>
    {spans.map((span, i) => {
      if (typeof span === "string") {
        return <React.Fragment key={i}>{span}</React.Fragment>;
      }
      if ("code" in span) return <Code key={i}>{span.code}</Code>;
      if ("to" in span) {
        return (
          <RouterTextLink key={i} to={span.to} tone="underline">
            <Spans spans={span.text} />
          </RouterTextLink>
        );
      }
      return (
        <TextLink key={i} href={span.href} tone="underline">
          <Spans spans={span.text} />
        </TextLink>
      );
    })}
  </>
);

export const Blocks: React.FC<{ blocks: Block[] }> = ({ blocks }) => (
  <>
    {blocks.map((block, i) =>
      block.kind === "p" ? (
        <Text key={i} tone="fg-muted" className="mb-4">
          <Spans spans={block.spans} />
        </Text>
      ) : (
        <Text
          key={i}
          as="ul"
          list="disc"
          tone="fg-muted"
          className="pl-6 space-y-2 mb-4"
        >
          {block.items.map((item, j) => (
            <li key={j}>
              <Spans spans={item} />
            </li>
          ))}
        </Text>
      ),
    )}
  </>
);
