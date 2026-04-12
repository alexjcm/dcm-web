import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useAppContext } from "../../context/app-context";
import { PageLoader } from "../ui/loaders";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isLoaded, isSignedIn } = useAppContext();

  if (!isLoaded) {
    return <PageLoader label="Inicializando sesión..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};
