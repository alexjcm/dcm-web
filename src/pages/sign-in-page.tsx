import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router";

import { PageLoader } from "../components/ui/loaders";

export const SignInPage = () => {
  const { isLoading, isAuthenticated, error, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return <PageLoader label="Cargando autenticación..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Aportes Familiares</h1>
        <p className="mt-2 text-sm text-slate-600">Inicia sesión con tu cuenta autorizada para continuar.</p>

        {error ? (
          <p className="mt-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            Error de autenticación: {error.message}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            onClick={() => {
              void loginWithRedirect();
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </section>
    </main>
  );
};
