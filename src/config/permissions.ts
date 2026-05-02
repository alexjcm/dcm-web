export const APP_PERMISSIONS = {
  summaryRead: "summary:read",
  contributionsRead: "contributions:read",
  contributionsWrite: "contributions:write",
  contributorsRead: "contributors:read",
  contributorsWrite: "contributors:write",
  settingsRead: "settings:read",
  settingsWrite: "settings:write",
  auth0SyncWrite: "auth0_sync:write"
} as const;

export type AppPermission = (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];
