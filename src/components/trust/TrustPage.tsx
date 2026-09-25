import React from "react";

interface TrustPageProps {
  title: string;
  children: React.ReactNode;
}

// The frame every trust page shares: /terms, /privacy, /security,
// /subprocessors and /status (#144).
const TrustPage: React.FC<TrustPageProps> = ({ title, children }) => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
    <h1 className="text-3xl md:text-4xl font-bold text-fg">{title}</h1>
    <div className="mt-6 space-y-4 text-fg-muted">{children}</div>
  </div>
);

export default TrustPage;
