import { Link } from "react-router";

export const NotFoundPage = () => {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Ruta no encontrada</h1>
      <p className="text-sm text-slate-600">La página solicitada no existe.</p>
      <Link to="/dashboard" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
        Ir al dashboard
      </Link>
    </main>
  );
};
