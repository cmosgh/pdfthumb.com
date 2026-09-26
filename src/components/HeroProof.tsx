import React from "react";
import { pageThumbnailCurl } from "../utils/curl";
import { Card, CodeBlock, Text } from "./ui";
import page1 from "../assets/hero-proof/page-1.jpg";
import page2 from "../assets/hero-proof/page-2.jpg";
import page3 from "../assets/hero-proof/page-3.jpg";

// What the API returned for pages 1-3 of scripts/hero-proof/sample.pdf,
// unmodified (#140; the calls are in scripts/hero-proof/commands.txt).
const THUMBNAILS = [
  { src: page1, title: "Quarterly report" },
  { src: page2, title: "Product sheet" },
  { src: page3, title: "Invoice" },
];

// The hero's proof: a real request beside the thumbnails it produced.
const HeroProof: React.FC = () => (
  <Card
    variant="raised"
    className="grid gap-6 p-4 sm:p-6 text-left lg:grid-cols-2 lg:items-center"
  >
    <div className="min-w-0">
      <Text size="sm" weight="semibold" tone="fg-subtle" className="mb-2">
        Request
      </Text>
      <CodeBlock
        data-testid="hero-request"
        className="whitespace-pre-wrap wrap-anywhere"
      >
        {pageThumbnailCurl("sample.pdf")}
      </CodeBlock>
    </div>
    <div className="min-w-0">
      <Text size="sm" weight="semibold" tone="fg-subtle" className="mb-2">
        Response: pages 1–3 at width=400
      </Text>
      <ul className="grid grid-cols-3 gap-3" data-testid="hero-thumbnails">
        {THUMBNAILS.map(({ src, title }, i) => (
          <li key={src}>
            <img
              src={src}
              width={400}
              height={566}
              alt={`Page ${i + 1} of the sample PDF: ${title}`}
              className="w-full h-auto rounded border border-line shadow-sm"
            />
          </li>
        ))}
      </ul>
    </div>
  </Card>
);

export default HeroProof;
