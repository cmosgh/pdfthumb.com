import React from "react";
import type { User } from "../../types";
import { Card, Heading, Text } from "@/components/ui";

interface ProfileSettingsProps {
  user: Pick<User, "name" | "email">;
}

// The signed-in user's profile, read-only: the backend has no endpoint that
// updates it, and no created date or company to show yet (#77).
export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
  const fields = [
    { label: "Full Name", value: user.name, testId: "profile-name" },
    { label: "Email Address", value: user.email, testId: "profile-email" },
  ];

  return (
    <Card
      variant="panel"
      className="p-6"
      data-testid="profile-settings-section"
    >
      <Heading
        as="h3"
        size="lg"
        weight="semibold"
        tone="fg-strong"
        className="mb-6"
      >
        Profile Settings
      </Heading>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(({ label, value, testId }) => (
          <div key={testId}>
            <Text
              as="dt"
              size="sm"
              weight="medium"
              tone="fg-2"
              className="block mb-1"
            >
              {label}
            </Text>
            <Card
              as="dd"
              variant="field"
              className="px-3 py-2"
              data-testid={testId}
            >
              {/* Google may withhold an email, or a name, from the profile. */}
              {value || "Not provided"}
            </Card>
          </div>
        ))}
      </dl>
    </Card>
  );
};
