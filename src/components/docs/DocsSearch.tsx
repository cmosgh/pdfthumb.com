import React, { useMemo, useState } from "react";
import { searchDocs, type SearchResult } from "@/docs/search.ts";
import { Dialog, Input, NavItem, Text } from "@/components/ui";

interface DocsSearchProps {
  open: boolean;
  // Escape or a click outside.
  onClose: () => void;
  // A result was chosen: jump to its anchor.
  onNavigate: (id: string) => void;
}

const LISTBOX_ID = "docs-search-results";
const optionId = (index: number) => `docs-search-option-${index}`;

// The /docs search dialog (#142): a combobox over the docs content. The
// arrow keys move through the results, Enter jumps to one, Escape closes.
export const DocsSearch: React.FC<DocsSearchProps> = ({
  open,
  onClose,
  onNavigate,
}) => (
  <Dialog
    open={open}
    variant="lg"
    onClose={onClose}
    aria-label="Search the documentation"
    panelClassName="self-start mt-20"
    data-testid="docs-search"
  >
    {/* Mounted per opening, so each search starts empty. */}
    {open && <SearchBox onNavigate={onNavigate} />}
  </Dialog>
);

const SearchBox: React.FC<{ onNavigate: (id: string) => void }> = ({
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchDocs(query), [query]);

  const move = (step: number) => {
    if (!results.length) return;
    const next = (active + step + results.length) % results.length;
    setActive(next);
    document.getElementById(optionId(next))?.scrollIntoView({
      block: "nearest",
    });
  };

  const choose = (result: SearchResult | undefined) => {
    if (result) onNavigate(result.entry.id);
  };

  return (
    <>
      <Input
        type="text"
        role="combobox"
        aria-label="Search the documentation"
        aria-expanded={results.length > 0}
        aria-controls={LISTBOX_ID}
        aria-autocomplete="list"
        aria-activedescendant={results.length ? optionId(active) : undefined}
        placeholder="Search sections, parameters and error codes"
        autoComplete="off"
        spellCheck={false}
        autoFocus
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            move(event.key === "ArrowDown" ? 1 : -1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            choose(results[active]);
          }
        }}
        className="w-full"
      />
      <div
        id={LISTBOX_ID}
        role="listbox"
        aria-label="Results"
        className="mt-3 max-h-[60vh] overflow-y-auto space-y-1"
      >
        {results.map((result, index) => (
          <NavItem
            key={result.entry.id}
            id={optionId(index)}
            role="option"
            aria-selected={index === active}
            tabIndex={-1}
            href={`#${result.entry.id}`}
            active={index === active}
            onMouseMove={() => setActive(index)}
            onClick={(event) => {
              event.preventDefault();
              choose(result);
            }}
          >
            <span className="block flex-1 min-w-0">
              <Text as="span" weight="semibold" className="block">
                {result.entry.title}
              </Text>
              <Text as="span" size="xs" tone="fg-subtle" className="block">
                {result.entry.context}
              </Text>
              <Text as="span" size="xs" tone="fg-muted" className="block mt-1">
                {result.excerpt}
              </Text>
            </span>
          </NavItem>
        ))}
      </div>
      {query.trim() && !results.length && (
        <Text size="sm" tone="fg-muted" className="mt-3" role="status">
          No results for “{query.trim()}”.
        </Text>
      )}
    </>
  );
};
