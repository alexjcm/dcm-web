import { Outlet } from "react-router";

import { AppNav } from "../ui/nav";
import { AppToaster } from "../ui/toaster";

export const AppShell = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <AppToaster />
    </div>
  );
};

