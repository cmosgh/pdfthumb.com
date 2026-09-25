import React from "react";

interface ProfileSettingsProps {
  name: string;
  email: string;
}

// The signed-in user's profile, read-only: the backend has no endpoint that
// updates it, and no created date or company to show yet (#77).
export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  name,
  email,
}) => {
  const fields = [
    { label: "Full Name", value: name, testId: "profile-name" },
    { label: "Email Address", value: email, testId: "profile-email" },
  ];

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      data-testid="profile-settings-section"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-6">
        Profile Settings
      </h3>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(({ label, value, testId }) => (
          <div key={testId}>
            <dt className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {label}
            </dt>
            <dd
              className="px-3 py-2 text-sm text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-700 rounded-md"
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
