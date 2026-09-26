import React from "react";
import { DOCS_NAV, type NavEntry } from "@/docs/content.ts";
import { NavItem, Text } from "@/components/ui";

interface DocsNavProps {
  // The section scroll-spy says is in view.
  current: string;
  // Called when a link is followed (the phone menu closes).
  onNavigate?: () => void;
  // The first link, to focus when the phone menu opens.
  firstLinkRef?: React.Ref<HTMLAnchorElement>;
}

const EntryLabel: React.FC<{ entry: NavEntry; size?: "xs" }> = ({
  entry,
  size,
}) =>
  entry.mono ? (
    <Text as="span" mono size={size}>
      {entry.label}
    </Text>
  ) : (
    <>{entry.label}</>
  );

// The /docs table of contents (#142): the sidebar on desktop, the
// Contents menu on a phone. Each link is an anchor on the page.
export const DocsNav: React.FC<DocsNavProps> = ({
  current,
  onNavigate,
  firstLinkRef,
}) => (
  <nav aria-label="Documentation">
    {DOCS_NAV.map((group, g) => (
      <div key={group.label} className="mb-4">
        <Text
          size="xs"
          weight="semibold"
          uppercase
          tracking="wider"
          tone="fg-subtle"
          className="px-4 mb-1"
        >
          {group.label}
        </Text>
        <ul>
          {group.entries.map((entry, e) => {
            const active = entry.id === current;
            return (
              <li key={entry.id}>
                <NavItem
                  ref={g === 0 && e === 0 ? firstLinkRef : undefined}
                  href={`#${entry.id}`}
                  active={active}
                  aria-current={active ? "location" : undefined}
                  onClick={onNavigate}
                  density="compact"
                >
                  <EntryLabel entry={entry} />
                </NavItem>
                {entry.children && (
                  <ul className="pl-4">
                    {entry.children.map((child) => (
                      <li key={child.id}>
                        <NavItem
                          href={`#${child.id}`}
                          onClick={onNavigate}
                          density="nested"
                        >
                          <EntryLabel entry={child} size="xs" />
                        </NavItem>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);
