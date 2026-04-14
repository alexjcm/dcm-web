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

const DashboardPage = lazy(async () => {
  const module = await import("./pages/dashboard-page");
  return { default: module.DashboardPage };
});

const AnnualPage = lazy(async () => {
  const module = await import("./pages/annual-page");
  return { default: module.AnnualPage };
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

const withSuspense = (node: ReactNode) => {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
};

export const App = () => {
  return (
    <Routes>
      <Route path="/sign-in" element={withSuspense(<SignInPage />)} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={withSuspense(<DashboardPage />)} />
        <Route path="annual" element={withSuspense(<AnnualPage />)} />
        <Route path="contributions" element={withSuspense(<ContributionsPage />)} />
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
