const rawAuth0Domain = (import.meta.env.VITE_AUTH0_DOMAIN ?? "").trim();
const rawAuth0ClientId = (import.meta.env.VITE_AUTH0_CLIENT_ID ?? "").trim();
const rawAuth0Audience = (import.meta.env.VITE_AUTH0_AUDIENCE ?? "").trim();

if (!rawAuth0Domain) {
  throw new Error("Missing VITE_AUTH0_DOMAIN");
}

if (!rawAuth0ClientId) {
  throw new Error("Missing VITE_AUTH0_CLIENT_ID");
}

if (!rawAuth0Audience) {
  throw new Error("Missing VITE_AUTH0_AUDIENCE");
}

export const AUTH0_DOMAIN = rawAuth0Domain;
export const AUTH0_CLIENT_ID = rawAuth0ClientId;
export const AUTH0_AUDIENCE = rawAuth0Audience;
