const SESSION_RECOVERY_ATTEMPT_KEY = "auth:session-recovery-attempt";
const SESSION_RECOVERY_REASON = "session-expired";
const SESSION_RECOVERY_WINDOW_MS = 60_000;

type SessionRecoveryAttempt = {
  at: number;
  returnTo: string;
};

const isValidReturnTo = (value: string): boolean => {
  return value.startsWith("/") && !value.startsWith("//");
};

export const normalizeReturnTo = (value: string | null | undefined): string => {
  if (!value) {
    return "/contributions";
  }

  try {
    const decoded = decodeURIComponent(value);
    return isValidReturnTo(decoded) ? decoded : "/contributions";
  } catch {
    return isValidReturnTo(value) ? value : "/contributions";
  }
};

export const getCurrentReturnTo = (): string => {
  return normalizeReturnTo(`${window.location.pathname}${window.location.search}${window.location.hash}`);
};

export const buildSignInPath = (returnTo: string, reason?: string): string => {
  const params = new URLSearchParams();

  if (returnTo && returnTo !== "/") {
    params.set("returnTo", returnTo);
  }

  if (reason) {
    params.set("reason", reason);
  }

  const query = params.toString();
  return query ? `/sign-in?${query}` : "/sign-in";
};

const readSessionRecoveryAttempt = (): SessionRecoveryAttempt | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_RECOVERY_ATTEMPT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SessionRecoveryAttempt>;

    if (typeof parsed.at !== "number" || typeof parsed.returnTo !== "string") {
      return null;
    }

    return {
      at: parsed.at,
      returnTo: normalizeReturnTo(parsed.returnTo)
    };
  } catch {
    return null;
  }
};

export const canAttemptSessionRecovery = (returnTo: string): boolean => {
  const attempt = readSessionRecoveryAttempt();

  if (!attempt) {
    return true;
  }

  return Date.now() - attempt.at > SESSION_RECOVERY_WINDOW_MS || attempt.returnTo !== normalizeReturnTo(returnTo);
};

export const markSessionRecoveryAttempt = (returnTo: string): void => {
  const attempt: SessionRecoveryAttempt = {
    at: Date.now(),
    returnTo: normalizeReturnTo(returnTo)
  };

  sessionStorage.setItem(SESSION_RECOVERY_ATTEMPT_KEY, JSON.stringify(attempt));
};

export const clearSessionRecoveryAttempt = (): void => {
  sessionStorage.removeItem(SESSION_RECOVERY_ATTEMPT_KEY);
};

export const getSessionRecoveryReason = (value: string | null | undefined): string | null => {
  return value === SESSION_RECOVERY_REASON ? SESSION_RECOVERY_REASON : null;
};

export const isSessionRecoveryReason = (value: string | null | undefined): boolean => {
  return getSessionRecoveryReason(value) === SESSION_RECOVERY_REASON;
};

export const SESSION_RECOVERY_QUERY_REASON = SESSION_RECOVERY_REASON;
