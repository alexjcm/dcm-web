import { Outlet } from "react-router";

import { AppNav } from "../ui/nav";
import { AppToaster } from "../ui/toaster";

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-app">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <AppToaster />
    </div>
  );
};
