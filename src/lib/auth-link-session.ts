const LINK_SESSION_TOKEN_KEY = "dcm_session_token";

const hasText = (value: string | null | undefined): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const readLinkSessionToken = (): string | null => {
  const value = sessionStorage.getItem(LINK_SESSION_TOKEN_KEY);
  return hasText(value) ? value : null;
};

export const persistLinkSession = (params: { sessionToken?: string | null }): void => {
  if (hasText(params.sessionToken)) {
    sessionStorage.setItem(LINK_SESSION_TOKEN_KEY, params.sessionToken);
  }
};

export const clearLinkSession = (): void => {
  sessionStorage.removeItem(LINK_SESSION_TOKEN_KEY);
};
