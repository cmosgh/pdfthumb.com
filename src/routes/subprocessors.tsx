import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import TrustPage from "../components/trust/TrustPage";
import {
  SUBPROCESSORS,
  SUBPROCESSORS_NOT_USED,
  TRUST_FACTS_UPDATED,
} from "../components/trust/securityFacts";
import ContactEmail from "../components/ContactEmail";
import {
  RouterTextLink,
  Table,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
} from "../components/ui";

export const Route = createFileRoute("/subprocessors")({
  head: () => ({
    meta: [{ title: `Subprocessors | ${APP_NAME}` }],
  }),
  component: SubprocessorsPage,
});

// The companies that handle data on our behalf (#144).
function SubprocessorsPage() {
  return (
    <TrustPage title="Subprocessors">
      <p>
        The companies that handle data on our behalf, and what each one sees.
        Last updated {TRUST_FACTS_UPDATED}.
      </p>
      <TableFrame variant="docs">
        <Table density="compact">
          <THead>
            <tr>
              <Th scope="col" className="text-left">
                Subprocessor
              </Th>
              <Th scope="col" className="text-left">
                Purpose
              </Th>
              <Th scope="col" className="text-left">
                Data
              </Th>
            </tr>
          </THead>
          <TBody>
            {SUBPROCESSORS.map(({ name, purpose, data }) => (
              <tr key={name}>
                <Td rowHeader weight="medium" tone="fg" className="text-left">
                  {name}
                </Td>
                <Td>{purpose}</Td>
                <Td>{data}</Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </TableFrame>
      <p>{SUBPROCESSORS_NOT_USED}</p>
      <p>
        How we treat your files and account:{" "}
        <RouterTextLink to="/security" tone="underline">
          Security
        </RouterTextLink>
        . Questions: <ContactEmail kind="support" />
      </p>
    </TrustPage>
  );
}
