import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import TrustPage from "../components/trust/TrustPage";
import {
  SECURITY_SECTIONS,
  TRUST_FACTS_UPDATED,
} from "../components/trust/securityFacts";
import { Heading, Text, TextLink } from "../components/ui";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [{ title: `Security | ${APP_NAME}` }],
  }),
  component: SecurityPage,
});

// How the service treats your files, keys and account (#144), one section
// per topic, each linkable by its id.
function SecurityPage() {
  return (
    <TrustPage title="Security">
      <p>
        What happens to the files you send us, and how we protect your account.
        Last updated {TRUST_FACTS_UPDATED}.
      </p>
      <nav aria-label="On this page" data-testid="security-toc">
        <Text as="ul" list="disc" className="pl-5 space-y-1">
          {SECURITY_SECTIONS.map(({ id, heading }) => (
            <li key={id}>
              <TextLink href={`#${id}`} tone="underline">
                {heading}
              </TextLink>
            </li>
          ))}
        </Text>
      </nav>
      {SECURITY_SECTIONS.map(({ id, heading, points }) => (
        <section key={id} id={id} className="pt-6 scroll-mt-20">
          <Heading as="h2" size="xl" weight="semibold" tone="fg">
            {heading}
          </Heading>
          <Text as="ul" list="disc" className="mt-3 pl-5 space-y-2">
            {points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </Text>
        </section>
      ))}
    </TrustPage>
  );
}
