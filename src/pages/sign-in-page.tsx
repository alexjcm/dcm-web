import { Navigate } from "react-router";
import { SignIn, useAuth } from "@clerk/react-router";

import { PageLoader } from "../components/ui/loaders";

export const SignInPage = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <PageLoader label="Cargando autenticación..." />;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Aportes Familiares</h1>
        <p className="mt-2 text-sm text-slate-600">Inicia sesión con tu cuenta autorizada para continuar.</p>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-in" />
        </div>
      </section>
    </main>
  );
};
