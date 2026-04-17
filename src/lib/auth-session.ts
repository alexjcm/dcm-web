export const AUTH_SESSION_ERROR_MESSAGE =
  "Tu sesión venció o no pudo verificarse. Pulsa Salir e ingresa de nuevo.";

export class AuthSessionError extends Error {
  readonly code: string | null;

  constructor(message: string = AUTH_SESSION_ERROR_MESSAGE, code: string | null = null) {
    super(message);
    this.name = "AuthSessionError";
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const getAuthErrorCode = (error: unknown): string | null => {
  if (!isRecord(error)) {
    return null;
  }

  const candidates = [error.error, error.code];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
};

export const isAuthSessionRecoveryError = (error: unknown): boolean => {
  const code = getAuthErrorCode(error);

  if (!code) {
    return false;
  }

  return new Set([
    "login_required",
    "consent_required",
    "interaction_required",
    "missing_refresh_token",
    "invalid_grant",
    "invalid_refresh_token"
  ]).has(code);
};

export const normalizeApiErrorDetail = (status: number, code: string, detail: string): string => {
  if (status === 401 && code === "UNAUTHENTICATED") {
    return AUTH_SESSION_ERROR_MESSAGE;
  }

  return detail;
};
