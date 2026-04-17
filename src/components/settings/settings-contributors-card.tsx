import { Check, Edit2, Mail, Plus, Trash2, Users } from "lucide-react";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ContributorStatusBadge } from "../ui/state-badge";
import type { Contributor } from "../../types/domain";

type SettingsContributorsCardProps = {
  contributors: Contributor[];
  onCreateContributor: () => void;
  onEditContributor: (contributor: Contributor) => void;
  onToggleContributorStatus: (contributor: Contributor) => void;
};

export const SettingsContributorsCard = ({
  contributors,
  onCreateContributor,
  onEditContributor,
  onToggleContributorStatus
}: SettingsContributorsCardProps) => {
  return (
    <Card
      header={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary-600" />
            Lista de Contribuyentes
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {contributors.length} registros
            </span>
            <Button size="sm" icon={Plus} onClick={onCreateContributor}>
              Nuevo contribuyente
            </Button>
          </div>
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Nombres</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Estado</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contributors.map((contributor) => (
              <tr key={contributor.id} className="group transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-3.5">
                  <div>
                    <div className="font-bold leading-tight text-slate-900">{contributor.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Mail size={10} />
                      {contributor.email ?? "Sin correo"}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <ContributorStatusBadge status={contributor.status} />
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex justify-start gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={() => onEditContributor(contributor)}
                      aria-label="Editar contribuyente"
                    />
                    <Button
                      size="sm"
                      variant={contributor.status === 1 ? "danger" : "secondary"}
                      icon={contributor.status === 1 ? Trash2 : Check}
                      onClick={() => onToggleContributorStatus(contributor)}
                      aria-label={contributor.status === 1 ? "Desactivar contribuyente" : "Activar contribuyente"}
                    >
                      {contributor.status === 1 ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
