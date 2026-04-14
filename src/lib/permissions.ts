const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

const uniqueSorted = (permissions: string[]): string[] => {
  return Array.from(new Set(permissions.filter((value) => value.length > 0))).sort((left, right) => left.localeCompare(right));
};

const parsePermissionsClaim = (payload: Record<string, unknown>): string[] => {
  const raw = payload.permissions;
  if (!Array.isArray(raw)) {
    return [];
  }

  const items = raw.filter((item): item is string => typeof item === "string").map((item) => item.trim());
  return uniqueSorted(items);
};

const parseScopeClaim = (payload: Record<string, unknown>): string[] => {
  const raw = payload.scope;
  if (typeof raw !== "string") {
    return [];
  }

  return uniqueSorted(
    raw
      .split(" ")
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0)
  );
};

export const extractPermissionsFromAccessToken = (token: string): string[] => {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return [];
  }

  const fromPermissions = parsePermissionsClaim(payload);
  if (fromPermissions.length > 0) {
    return fromPermissions;
  }

  return parseScopeClaim(payload);
};

