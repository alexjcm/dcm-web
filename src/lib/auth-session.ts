export const AUTH_SESSION_ERROR_MESSAGE =
  "Tu sesión venció o no pudo verificarse. Pulsa Salir e ingresa de nuevo.";
export const AUTH_NETWORK_ERROR_CODE = "AUTH_NETWORK_ERROR";
export const AUTH_NETWORK_ERROR_MESSAGE =
  "No fue posible contactar Auth0. Verifica tu conexión e inténtalo de nuevo.";

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

const hasText = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
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

export const isAuthNetworkError = (error: unknown): boolean => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (!isRecord(error)) {
    return false;
  }

  const candidates = [error.message, error.description, error.error_description, error.reason];

  return candidates.some((candidate) => {
    if (!hasText(candidate)) {
      return false;
    }

    const normalized = candidate.trim().toLowerCase();

    return [
      "network",
      "fetch",
      "load failed",
      "failed to fetch",
      "timeout",
      "temporarily unavailable"
    ].some((fragment) => normalized.includes(fragment));
  });
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
  if (code === AUTH_NETWORK_ERROR_CODE) {
    return AUTH_NETWORK_ERROR_MESSAGE;
  }

  if (status === 401 && code === "UNAUTHENTICATED") {
    return AUTH_SESSION_ERROR_MESSAGE;
  }

  return detail;
};

export const getFriendlyAuthErrorMessage = (error: unknown): string | null => {
  if (!error || !isRecord(error)) {
    return null;
  }

  const message = (error.message as string) || "";
  const code = getAuthErrorCode(error);

  if (isAuthNetworkError(error)) {
    return AUTH_NETWORK_ERROR_MESSAGE;
  }

  // Handle unauthorized client/audience mismatch
  if (code === "unauthorized" || message.toLowerCase().includes("not authorized to access resource server")) {
    return "No se pudo iniciar el acceso al sistema. Es posible que falte una configuración de permisos en el proveedor de identidad. Por favor, contacta al administrador.";
  }

  return message || "Ocurrió un problema inesperado durante la autenticación.";
};
