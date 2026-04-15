import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router";
import { LogIn, ShieldCheck, ChevronRight } from "lucide-react";

import { PageLoader } from "../components/ui/loaders";
import { Button } from "../components/ui/button";

export const SignInPage = () => {
  const { isLoading, isAuthenticated, error, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return <PageLoader label="Cargando autenticación..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 sm:p-8 animate-in fade-in duration-700">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xl ring-4 ring-white">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Plataforma <span className="text-primary-600 italic">DMC</span>
          </h1>
          <p className="mt-4 text-sm font-semibold tracking-widest text-slate-500 uppercase">
            Gestión de Aportes Familiares
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">Acceso Seguro</h2>
            <p className="mt-1 text-sm text-slate-500 font-medium">Inicia sesión con tu cuenta autorizada para continuar.</p>
          </div>

          {error ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 animate-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <p className="text-sm font-bold text-rose-800 leading-relaxed">
                {error.message}
              </p>
            </div>
          ) : null}

          <Button
            onClick={() => loginWithRedirect()}
            className="w-full h-12 text-base font-bold"
            icon={LogIn}
          >
            Entrar al Sistema
          </Button>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-8">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-tighter">
               <ChevronRight size={14} className="text-primary-500" />
               Protección de Datos Grado Bancario
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} DMC Contributions • v2.0
        </p>
      </div>
    </main>
  );
};

