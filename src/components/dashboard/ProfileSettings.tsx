import React from "react";
import type { User } from "../../types";

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
    <div
      className="bg-surface rounded-lg shadow-sm border border-line p-6"
      data-testid="profile-settings-section"
    >
      <h3 className="text-lg font-semibold text-fg-strong mb-6">
        Profile Settings
      </h3>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(({ label, value, testId }) => (
          <div key={testId}>
            <dt className="block text-sm font-medium text-fg-2 mb-1">
              {label}
            </dt>
            <dd
              className="px-3 py-2 text-sm text-fg-strong bg-muted rounded-md"
              data-testid={testId}
            >
              {/* Google may withhold an email, or a name, from the profile. */}
              {value || "Not provided"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
