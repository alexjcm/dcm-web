# contributions-web

Family Contributions Management Frontend (React + Vite + Tailwind + Auth0 SPA SDK).

## Stack
- React 19 + TypeScript
- React Router 7
- Auth0 React SDK (`@auth0/auth0-react`)
- Tailwind CSS v4
- Lucide React (Icons)
- Headless UI
- Dark/Light Mode (Native Persistence)

## Environment Variables
Create `.env.local` with:

```bash
VITE_AUTH0_DOMAIN=dev-mz3wmzwe2532icvg.us.auth0.com
VITE_AUTH0_CLIENT_ID=kuzGkPKhYz56NDS4783Yy1b388XjMzYd
VITE_AUTH0_AUDIENCE=https://api.contributions
VITE_API_BASE_URL=http://localhost:8787
```

## Authentication and Permissions
- Login/logout with Auth0 Login.
- The frontend requests an access token with `audience`.
- Detailed Documentation:
  - **[RBAC Architecture](./docs/RBAC.md)**: Permissions and roles model.
  - **[Auth0 Configuration](./docs/auth0-setup.md)**: Session flows and identity security.
  - **[Theme System](./docs/THEME.md)**: Dark/light mode documentation and visual tokens.

## Local Development

Prerequisites:
- **Node.js**: Version 24+

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

`npm run dev` uses a fixed port `5173` with `--strictPort`.

## Functional Scope
- Session-protected routes.
- Permission guard for Settings (`settings:write`).
- HTTP client with `Authorization: Bearer <access_token>`.
- Dashboard, annual view, contributions, and settings.

## Current Structure
- `src/pages/`: main screens.
- `src/hooks/`: reusable hooks and orchestration hooks per screen when a view grows.
- `src/components/`: reusable UI blocks and screen-specific sections.
- `src/lib/`: pure utilities, HTTP client, and cross-cutting logic.
