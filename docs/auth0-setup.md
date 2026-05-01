# Auth0 setup (SPA React)

## Tenant/App Details
- Domain: `dcm-platform.us.auth0.com`
- Allowed domains (frontend): `dcm-platform.us.auth0.com`
- Audience: `https://api.dcm`

## Configuration in `Applications > Applications > (SPA)`

### Local
- Allowed Callback URLs: `http://localhost:5173`
- Allowed Logout URLs: `http://localhost:5173`
- Allowed Web Origins: `http://localhost:5173`

### Production
- Allowed Callback URLs: `https://contrib-dcm.pages.dev`
- Allowed Logout URLs: `https://contrib-dcm.pages.dev`
- Allowed Web Origins: `https://contrib-dcm.pages.dev`
- Application Login URI: `https://contrib-dcm.pages.dev/auth/login`

## SPA Configuration
- Application Type: `Single Page Application`
- Refresh Token Rotation: `ON`
- Advanced Settings / Grant Types: Confirm support for Refresh Token
- Allowed Origins (CORS): Use the same production origin if required by your tenant dashboard.
- **Important Notes:**
  - If a **custom domain** is used, add it as well to Callback, Logout, and Web Origins.
  - The **Allowed Web Origins** field must exactly match the origin used by the SPA for silent authentication to work correctly.

## Manual User Creation (Auth0 Dashboard)
When an administrator creates a database user directly from the Auth0 dashboard:
- This is an exceptional path reserved for `superadmin`.
- If that user should be treated as a canonical DCM account for linking, set `app_metadata.dcm_managed = true`.

## Recommended frontend variables:
- `VITE_AUTH0_DOMAIN=dcm-platform.us.auth0.com`
- Optional UX alternative: Configure a Custom Error Page in Auth0 that redirects to `https://contrib-dcm.pages.dev/auth/error`.

## Google Social Login Reference
- Social Connection in Auth0: `google-oauth2`
- Do not use `Auth0 Developer Keys`; use your own Google OAuth credentials.
- Google Cloud Project: `dcm-contributions`
- Google OAuth App: `DCM Contributions`
- Google OAuth App Audience/User type: `External`
- Google OAuth App Publishing status: `Testing` while using `Test Users`.
- Google OAuth Client: `DCM Contributions Auth0 Client`
- Google OAuth Client type: `Web application`
- Authorized domain in Google Branding: `auth0.com`
- Test users: Explicitly add the Google accounts that will be used for validation while the app is in `Testing` mode.
- Authorized JavaScript origin in Google:
  - `https://dcm-platform.us.auth0.com`
- Redirect URI configured in Google: `https://dcm-platform.us.auth0.com/login/callback`
- In Auth0, the connection settings:
  - Purpose: `Authentication`
  - Permissions: `Basic Profile`, `Extended Profile`
  - Enabled Application: `Contributions Web App`
- If the `Client Secret` is rotated in Google, update it immediately in `Authentication > Social > google-oauth2` in Auth0.
- Optional: Finally, after testing in Auth0 and verifying it works correctly, go to Audience > click on "Publish App".

## Account Linking
- **Logic:** Suggested Google ↔ canonical DCM account linking via Auth0 Actions and DCM API.
- **Action Configuration:** Requires `SESSION_TOKEN_SECRET`, `DCM_PWA_URL`, `AUTH0_DOMAIN`, `M2M_CLIENT_ID`, and `M2M_CLIENT_SECRET`.
- **PWA:** `/link-account` route for confirmation. Automatic recovery from `Invalid state` in `main.tsx`.
- **API:** `POST /api/auth/link-token` endpoint for identity validation.
- **Metadata:** `account_linking_timestamp` and `dcm_managed = true` must remain on the primary profile after linking.

## Contributor sync behavior in the UI

### Global toggle
- `auth0_auto_sync_enabled` controls contributor lifecycle sync from the admin UI.
- If the toggle is `OFF`, create/edit/activate/deactivate operations persist only in DCM.
- The Auth0 login/linking Action does not depend on this toggle.

### No manual sync action
- The Settings screen no longer exposes manual buttons to create, verify, or retry contributor access in Auth0.
- Contributor access states shown in the UI reflect only automatic sync results from normal lifecycle operations.

### Expected contributor states
- `Sin cuenta`: no usable Auth0 account resolved.
- `Pendiente`: DB account exists but password setup is still pending.
- `Con cuenta`: valid Auth0 identity resolved for DCM and minimum role assignment completed.
- `Sin permisos`: Auth0 account exists, but it currently has no roles and DCM respected that administrative state.
- `Error`: resolution, provisioning, or role assignment failed.

## Password reset return flow
- Production DB-user password setup and password reset flows rely on Auth0 Universal Login returning to the SPA through the configured Application Login URI.
- The technical return route is `/auth/login`.
- `/auth/login` must auto-start `loginWithRedirect()` and always return to `/contributions` after successful authentication.
- `/sign-in` remains the manual human-facing login page.
- This improved return UX applies to the production SPA only. Auth0 does not support `localhost` as an Application Login URI, so local development does not mirror the same post-reset return flow.

### Social-first behavior
- If a valid social account already exists in Auth0 and DCM accepts it as the canonical account, the UI should end with `Con cuenta` on that same identity.
- The system must not create a parallel DB account just to send a password reset email.

### Deactivation behavior
- If auto-sync is `ON` and the contributor has an Auth0 account, deactivation keeps the user in Auth0 but restricts access to the `viewer` role only.
- Exception: if the Auth0 user already has zero roles because an admin removed them intentionally, DCM keeps that no-role state and shows `Sin permisos`.

## API Configuration
- API Identifier / Audience: `https://api.dcm`
- RBAC: `ON`
- Add Permissions in the Access Token: `ON`
- Allow Offline Access: `ON`

## Recommended production verifications
- Origin must exactly match `https://contrib-dcm.pages.dev`.
- If a custom domain is added, also include it in Callback, Logout, and Web Origins.

## Notes for this app
- The frontend requests an access token with `audience`.
- The backend uses permissions (`permissions`) with `scope` as a fallback.

## PWA and session behavior
- The app can be installed as a PWA, but authentication still depends on Auth0.
- The shell/UI can be opened offline, but data read and write operations require actual connectivity to the API.

## Auth0 Actions Configuration for access control

**STEP 1 — Create M2M App**
Dashboard → Applications → Create Application → Machine to Machine → select Auth0 Management API → scopes: `update:users` `read:users` `read:roles` → save `Client ID` and `Client Secret`.

**STEP 2 — Obtain viewer role ID**
Dashboard → User Management → Roles → viewer → copy `rol_xxxxxxxxxxxxxxxx`.

**STEP 3 — Create Action: dcm-access-and-account-linking**
Dashboard → Actions → Library → Create Action
- Trigger: `Post Login`

**STEP 4 — Configure Action secrets**
- `AUTH0_DOMAIN`
- `M2M_CLIENT_ID`
- `M2M_CLIENT_SECRET`
- `SESSION_TOKEN_SECRET`
- `DCM_PWA_URL`

**STEP 5 — Activate Action in the trigger**
Dashboard → Actions → Flows → Login → drag **dcm-access-and-account-linking** between Start and Complete → **Apply**.
