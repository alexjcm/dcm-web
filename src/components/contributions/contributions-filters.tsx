import { X } from "lucide-react";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Select } from "../ui/fields";
import type { Contributor } from "../../types/domain";

type ContributionsFiltersProps = {
  contributorIdFilter: number | null;
  contributorOptions: Contributor[];
  hasActiveFilters: boolean;
  onChangeContributorFilter: (value: number | null) => void;
  onClearFilters: () => void;
};

export const ContributionsFilters = ({
  contributorIdFilter,
  contributorOptions,
  hasActiveFilters,
  onChangeContributorFilter,
  onClearFilters
}: ContributionsFiltersProps) => {
  return (
    <Card bodyClassName="p-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-start">
        <div className="shrink-0 text-sm font-medium text-slate-700 md:min-w-[110px]">Contribuyente</div>
        <Select
          value={contributorIdFilter ?? ""}
          onChange={(event) => onChangeContributorFilter(event.target.value ? Number(event.target.value) : null)}
          className="h-10 min-w-0 w-full md:w-[360px] lg:w-[420px]"
        >
          <option value="">Todos los contribuyentes</option>
          {contributorOptions.map((contributor) => (
            <option key={contributor.id} value={contributor.id}>
              {contributor.name}
            </option>
          ))}
        </Select>
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" icon={X} onClick={onClearFilters} aria-label="Limpiar filtro" />
        ) : null}
      </div>
    </Card>
  );
};
