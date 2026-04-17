import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatCentsAsCurrency } from "../../lib/money";
import type { Contribution, Contributor } from "../../types/domain";
import type { ContributionsMonthGroup, ContributionsYearGroup } from "../../types/contributions-page";

type ContributionsYearGroupsProps = {
  activeYear: number;
  currentBusinessMonth: number;
  canMutateCurrentPeriod: boolean;
  contributorById: Map<number, Contributor>;
  yearGroups: ContributionsYearGroup[];
  isMonthOpen: (group: ContributionsMonthGroup) => boolean;
  onToggleMonth: (key: string, nextValue: boolean) => void;
  onEditContribution: (contribution: Contribution) => void;
  onDeleteContribution: (contribution: Contribution) => void;
};

export const ContributionsYearGroups = ({
  activeYear,
  currentBusinessMonth,
  canMutateCurrentPeriod,
  contributorById,
  yearGroups,
  isMonthOpen,
  onToggleMonth,
  onEditContribution,
  onDeleteContribution
}: ContributionsYearGroupsProps) => {
  return (
    <>
      {yearGroups.map((yearGroup) => (
        <section key={yearGroup.year} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Aportes {yearGroup.year}</h3>
            </div>
          </div>

          {yearGroup.months.map((group) => {
            const expanded = isMonthOpen(group);
            const isCurrentMonth = group.year === activeYear && group.month === currentBusinessMonth;

            return (
              <Card key={group.key} bodyClassName="p-0">
                <button
                  type="button"
                  onClick={() => onToggleMonth(group.key, !expanded)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <p className="text-base font-extrabold text-slate-900">{group.label}</p>
                    {isCurrentMonth ? (
                      <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-700">
                        Actual
                      </span>
                    ) : null}
                  </div>
                  <span className="flex items-center text-slate-500">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                </button>

                {expanded ? (
                  <div className="border-t border-slate-100">
                    {group.items.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-slate-500">No hay aportes registrados en {group.label}.</div>
                    ) : null}
                    <div className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const contributor = contributorById.get(item.contributorId);

                        return (
                          <article
                            key={item.id}
                            className="grid gap-2 px-4 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{item.contributorName}</p>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:min-w-[200px] sm:justify-end">
                              <div className="text-sm font-extrabold text-slate-900">{formatCentsAsCurrency(item.amountCents)}</div>
                              <div className="flex gap-2 sm:justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={Edit2}
                                  onClick={() => onEditContribution(item)}
                                  disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                                  aria-label={`Editar aporte de ${item.contributorName}`}
                                  className="px-2.5"
                                />
                                <Button
                                  size="sm"
                                  variant="danger"
                                  icon={Trash2}
                                  onClick={() => onDeleteContribution(item)}
                                  disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                                  aria-label={`Eliminar aporte de ${item.contributorName}`}
                                  className="px-2.5"
                                />
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </section>
      ))}
    </>
  );
};
