import type { ReactNode } from "react";

import type { AppRole } from "../../config/auth";
import { useAppContext } from "../../context/app-context";

export const RoleRoute = ({ allowed, children }: { allowed: AppRole[]; children: ReactNode }) => {
  const { role } = useAppContext();

  if (!role || !allowed.includes(role)) {
    return (
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        No tienes permisos para acceder a esta sección.
      </section>
    );
  }

  return children;
};
