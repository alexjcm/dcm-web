import { useNavigate } from "react-router";
import { AlertCircle, Home } from "lucide-react";
import { AppVersionFooter } from "../components/ui/app-version-footer";
import { Button } from "../components/ui/button";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center bg-background p-6 animate-in fade-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-card)] border border-danger-200 bg-danger-50 text-danger-600 shadow-inner mb-8 dark:border-danger-800 dark:bg-danger-900/30 dark:text-danger-400">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 mb-2 dark:text-neutral-100">404</h1>
        <h2 className="text-xl font-bold text-neutral-700 mb-1 dark:text-neutral-300">Ruta no encontrada</h2>
        <p className="text-sm text-neutral-500 font-medium mb-8 text-center max-w-xs dark:text-neutral-400">
          La página que buscas no existe o ha sido movida a otra ubicación.
        </p>

        <Button
          icon={Home}
          onClick={() => navigate("/summary")}
        >
          Volver al Resumen
        </Button>
      </main>
      <AppVersionFooter />
    </div>
  );
};
