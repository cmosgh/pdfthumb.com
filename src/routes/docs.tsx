import React, { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import ApiReference, {
  useSnippetLanguage,
} from "../components/docs/ApiReference";
import { Blocks, Spans } from "../components/docs/DocsProse";
import { DocsNav } from "../components/docs/DocsNav";
import { DocsSearch } from "../components/docs/DocsSearch";
import { ANCHOR_OFFSET, DocsSection } from "../components/docs/DocsSection";
import {
  DOCS_INTRO,
  DOCS_TITLE,
  ERRORS,
  LIMITS,
  QUICKSTART,
  REFERENCE,
  SPY_IDS,
  SWAGGER_LINK,
  errorAnchor,
  type ProseSection,
} from "../docs/content";
import { docsMarkdown } from "../docs/markdown";
import { useScrollSpy } from "../hooks/useScrollSpy";
import {
  Button,
  buttonClasses,
  Code,
  CodeSample,
  Container,
  CopyButton,
  Heading,
  MenuIcon,
  SearchIcon,
  Surface,
  Table,
  TableFrame,
  TBody,
  Td,
  Text,
  Th,
  THead,
} from "../components/ui";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [{ title: `Documentation | ${APP_NAME}` }],
  }),
  component: DocsPage,
});

const MOBILE_NAV_ID = "docs-mobile-nav";

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Heading as="h2" size="2xl" weight="bold" tone="heading" className="mb-4">
    {children}
  </Heading>
);

const ProseDocsSection: React.FC<{ section: ProseSection }> = ({ section }) => (
  <DocsSection
    id={section.id}
    data-testid={section.testId}
    heading={<SectionHeading>{section.title}</SectionHeading>}
    panel={
      section.code && (
        <CodeSample
          data-testid="docs-code"
          code={section.code.code}
          preProps={{ "data-testid": section.code.testId }}
        />
      )
    }
  >
    <Blocks blocks={section.blocks} />
  </DocsSection>
);

// A typed "/" belongs to whatever field has focus.
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

// Follows an anchor as a link would; the same hash again re-scrolls.
function jumpTo(id: string) {
  if (window.location.hash === `#${id}`) {
    document.getElementById(id)?.scrollIntoView();
  } else {
    window.location.hash = id;
  }
}

// The documentation (#126), in three panes from lg up (#142): the table of
// contents, the prose, and each section's code beside it. On a phone a
// sticky bar holds the Contents menu and Search.
function DocsPage() {
  const [language, setLanguage] = useSnippetLanguage();
  const current = useScrollSpy(SPY_IDS);

  // The phone's Contents menu: a disclosure over the page.
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  // Focus goes back to the trigger on close. A clicked button is passed
  // in, since Safari doesn't focus buttons on click.
  const openSearch = useCallback((trigger?: HTMLElement) => {
    returnFocus.current =
      trigger ?? (document.activeElement as HTMLElement | null);
    setMenuOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    returnFocus.current?.focus({ preventScroll: true });
  }, []);
  const searchTo = useCallback((id: string) => {
    setSearchOpen(false);
    jumpTo(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey)
        return;
      if (event.defaultPrevented || isTyping(event.target)) return;
      event.preventDefault();
      openSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    firstLink.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!bar.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <Container className="py-8 lg:py-12" data-testid="docs-page">
      <div
        ref={bar}
        className="lg:hidden sticky top-16 z-40 -mx-4 sm:-mx-6 mb-8"
      >
        <Surface tone="bar" className="flex gap-2 px-4 sm:px-6 py-2">
          <Button
            ref={menuButton}
            variant="neutral"
            aria-expanded={menuOpen}
            aria-controls={MOBILE_NAV_ID}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2"
          >
            <MenuIcon className="w-4 h-4" aria-hidden="true" />
            Contents
          </Button>
          <Button
            variant="neutral"
            aria-keyshortcuts="/"
            onClick={(event) => openSearch(event.currentTarget)}
            className="inline-flex items-center gap-2"
          >
            <SearchIcon className="w-4 h-4" aria-hidden="true" />
            Search
          </Button>
        </Surface>
        <Surface
          tone="menu"
          id={MOBILE_NAV_ID}
          data-testid={MOBILE_NAV_ID}
          hidden={!menuOpen}
          className="absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto px-2 py-3"
        >
          <DocsNav
            current={current}
            onNavigate={() => setMenuOpen(false)}
            firstLinkRef={firstLink}
          />
        </Surface>
      </div>

      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block" data-testid="docs-sidebar">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8">
            <Button
              variant="neutral"
              aria-keyshortcuts="/"
              onClick={(event) => openSearch(event.currentTarget)}
              className="flex w-full items-center gap-2 mb-6"
            >
              <SearchIcon className="w-4 h-4" aria-hidden="true" />
              Search
              <Code aria-hidden="true" className="ml-auto">
                /
              </Code>
            </Button>
            <DocsNav current={current} />
          </div>
        </aside>

        <div className="min-w-0">
          <Heading
            as="h1"
            size="4xl"
            weight="extrabold"
            tone="heading"
            className="mb-4"
          >
            {DOCS_TITLE}
          </Heading>
          <Text tone="fg-muted" className="mb-4 max-w-3xl">
            <Spans spans={DOCS_INTRO} />
          </Text>
          <div className="flex flex-wrap items-center gap-3 mb-12">
            <a
              href={SWAGGER_LINK.href}
              className={buttonClasses({ variant: "swagger" })}
              data-testid="docs-swagger-link"
            >
              {SWAGGER_LINK.label}
            </a>
            <CopyButton
              variant="neutral"
              text={() => docsMarkdown(language, window.location.origin)}
              label="Copy as Markdown"
              copiedLabel="Copied as Markdown"
            />
          </div>

          <div id="quickstart">
            {QUICKSTART.map((section) => (
              <ProseDocsSection key={section.id} section={section} />
            ))}
          </div>

          <div data-testid="docs-limits">
            <ProseDocsSection section={LIMITS} />
            <DocsSection
              id={ERRORS.id}
              wide
              heading={<SectionHeading>{ERRORS.title}</SectionHeading>}
            >
              <div className="max-w-3xl">
                <Blocks blocks={ERRORS.blocks} />
              </div>
              <TableFrame variant="docs">
                <Table density="compact" data-testid="docs-error-codes">
                  <THead>
                    <tr>
                      {ERRORS.columns.map((column) => (
                        <Th key={column} className="text-left">
                          {column}
                        </Th>
                      ))}
                    </tr>
                  </THead>
                  <TBody>
                    {ERRORS.codes.map((error) => (
                      <tr
                        key={error.code}
                        id={errorAnchor(error)}
                        className={ANCHOR_OFFSET}
                      >
                        <Td tone="fg-muted" className="align-top">
                          <Code>{error.code}</Code>
                        </Td>
                        <Td tone="fg-muted" className="align-top">
                          {error.statuses.join(", ")}
                        </Td>
                        <Td tone="fg-muted" className="align-top">
                          {error.meaning}
                        </Td>
                        <Td tone="fg-muted" className="align-top">
                          {error.action}
                        </Td>
                      </tr>
                    ))}
                  </TBody>
                </Table>
              </TableFrame>
            </DocsSection>
          </div>

          <section id={REFERENCE.id} className={ANCHOR_OFFSET}>
            <SectionHeading>{REFERENCE.title}</SectionHeading>
            <ApiReference language={language} onLanguage={setLanguage} />
          </section>
        </div>
      </div>

      <DocsSearch
        open={searchOpen}
        onClose={closeSearch}
        onNavigate={searchTo}
      />
    </Container>
  );
}
