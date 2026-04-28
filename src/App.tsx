import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";

import { PermissionRoute } from "./components/auth/permission-route";
import { ProtectedRoute } from "./components/auth/protected-route";
import { AppShell } from "./components/layout/app-shell";
import { PageLoader } from "./components/ui/loaders";
import { APP_PERMISSIONS } from "./config/permissions";

const SignInPage = lazy(async () => {
  const module = await import("./pages/sign-in-page");
  return { default: module.SignInPage };
});

const SummaryPage = lazy(async () => {
  const module = await import("./pages/summary-page");
  return { default: module.SummaryPage };
});

const ContributionsPage = lazy(async () => {
  const module = await import("./pages/contributions-page");
  return { default: module.ContributionsPage };
});

 

const SettingsPage = lazy(async () => {
  const module = await import("./pages/settings-page");
  return { default: module.SettingsPage };
});

const NotFoundPage = lazy(async () => {
  const module = await import("./pages/not-found-page");
  return { default: module.NotFoundPage };
});

const AuthErrorPage = lazy(async () => {
  const module = await import("./pages/auth-error-page");
  return { default: module.AuthErrorPage };
});

const LinkAccountPage = lazy(async () => {
  const module = await import("./pages/link-account-page");
  return { default: module.LinkAccountPage };
});

const withSuspense = (node: ReactNode) => {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
};

export const App = () => {
  return (
    <Routes>
      <Route path="/sign-in" element={withSuspense(<SignInPage />)} />
      <Route path="/auth/error" element={withSuspense(<AuthErrorPage />)} />
      <Route path="/link-account" element={withSuspense(<LinkAccountPage />)} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="contributions" element={withSuspense(<ContributionsPage />)} />
        <Route index element={<Navigate to="/contributions" replace />} />
        <Route
          path="summary"
          element={
            <PermissionRoute required={APP_PERMISSIONS.summaryRead}>
              {withSuspense(<SummaryPage />)}
            </PermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionRoute required={APP_PERMISSIONS.settingsWrite}>
              {withSuspense(<SettingsPage />)}
            </PermissionRoute>
          }
        />
      </Route>

      <Route path="*" element={withSuspense(<NotFoundPage />)} />
    </Routes>
  );
};
