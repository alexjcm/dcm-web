import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { LogIn, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { AppVersionFooter } from "../components/ui/app-version-footer";

export const AuthErrorPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const state = searchParams.get("state");

  useEffect(() => {
    if (error || errorDescription) {
      console.group("🔐 Auth0 Error Trace");
      console.error("Error:", error);
      console.error("Description:", errorDescription);
      console.info("State:", state);
      console.groupEnd();
    }
  }, [error, errorDescription, state]);

  return (
    <div className="min-h-screen bg-white flex flex-col animate-in fade-in duration-500">
      {/* Compact Header */}
      <header className="border-b border-neutral-100 px-5 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img src="https://contrib-dcm.pages.dev/logo-base.png" alt="DCM" className="h-8 w-auto" />
          <button 
            onClick={() => navigate("/contributions")}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Volver al Portal
          </button>
        </div>
      </header>

      {/* Main Content Area - Extremely Condensed */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 mb-6 ring-1 ring-danger-100">
            <AlertCircle size={28} />
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 mb-3">
            No pudimos completar el inicio de sesión
          </h1>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={() => navigate("/sign-in")}
                className="h-10 px-8 text-sm font-bold shadow-sm"
                icon={LogIn}
              >
                Ir a iniciar sesión
              </Button>
              
              <p className="text-xs font-medium text-neutral-500 max-w-[240px] leading-relaxed">
                Contáctese con el administrador si el problema persiste.
              </p>
            </div>

          </div>
        </div>
      </main>
      <AppVersionFooter />
    </div>
  );
};
