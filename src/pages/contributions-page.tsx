import { lazy, Suspense } from "react";
import { Plus, ReceiptText } from "lucide-react";

import { ContributionsFilters } from "../components/contributions/contributions-filters";
import { ContributionsYearGroups } from "../components/contributions/contributions-year-groups";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { SectionLoader } from "../components/ui/loaders";
import { useContributionsPageState } from "../hooks/use-contributions-page-state";

const ContributionModal = lazy(async () => {
  const module = await import("../components/contributions/contribution-modal");
  return { default: module.ContributionModal };
});

export const ContributionsPage = () => {
  const {
    activeYear,
    canMutateCurrentPeriod,
    contributionRestrictionMessage,
    contributorById,
    contributorIdFilter,
    contributorOptions,
    activeContributorOptions,
    currentBusinessMonth,
    settings,
    contributions,
    yearGroups,
    hasActiveFilters,
    canLoadPreviousYear,
    oldestLoadedYear,
    totalVisibleItems,
    editState,
    submitting,
    pendingDelete,
    deleting,
    setContributorIdFilter,
    setPendingDelete,
    isMonthOpen,
    toggleMonth,
    openCreateModal,
    openEditModal,
    closeEditModal,
    handleSave,
    handleDelete,
    handleLoadPreviousYear,
    formatPeriodLabel
  } = useContributionsPageState();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-inner">
            <ReceiptText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Registro de Aportes</h2>
            <p className="mt-1 text-sm text-slate-500">Gestión detallada por mes para crear, corregir y eliminar aportes del período.</p>
          </div>
        </div>

        <Button
          icon={Plus}
          onClick={openCreateModal}
          disabled={!canMutateCurrentPeriod}
          className="w-full shadow-md shadow-primary-200 sm:w-auto"
        >
          Nuevo Aporte
        </Button>
      </header>

      <ContributionsFilters
        contributorIdFilter={contributorIdFilter}
        contributorOptions={contributorOptions}
        hasActiveFilters={hasActiveFilters}
        onChangeContributorFilter={setContributorIdFilter}
        onClearFilters={() => setContributorIdFilter(null)}
      />

      {contributions.loading && !contributions.data ? <SectionLoader label="Cargando registro de aportes..." /> : null}
      {contributions.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 animate-in fade-in">
          No se pudo cargar el listado: {contributions.error}
        </div>
      ) : null}

      {contributions.data && totalVisibleItems === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-base font-bold text-slate-900">
              {hasActiveFilters ? "No hay aportes para el filtro aplicado." : "No hay aportes registrados para este año."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {hasActiveFilters
                ? "Prueba con otro contribuyente o limpia el filtro."
                : canLoadPreviousYear
                  ? "Puedes cargar años anteriores o registrar un aporte para comenzar a poblar el historial."
                  : "Registra un aporte para comenzar a poblar el historial."}
            </p>
          </div>
        </Card>
      ) : null}

      <ContributionsYearGroups
        activeYear={activeYear}
        currentBusinessMonth={currentBusinessMonth}
        canMutateCurrentPeriod={canMutateCurrentPeriod}
        contributorById={contributorById}
        yearGroups={yearGroups}
        isMonthOpen={isMonthOpen}
        onToggleMonth={toggleMonth}
        onEditContribution={openEditModal}
        onDeleteContribution={setPendingDelete}
      />

      {contributions.data ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadPreviousYear}
            disabled={!canLoadPreviousYear || contributions.loading}
          >
            {canLoadPreviousYear ? `Cargar ${oldestLoadedYear - 1}` : "Sin más años"}
          </Button>
        </div>
      ) : null}

      {editState.open ? (
        <Suspense fallback={null}>
          <ContributionModal
            open={editState.open}
            contributors={activeContributorOptions}
            monthlyAmountCents={settings.monthlyAmountCents}
            defaultYear={activeYear}
            defaultMonth={currentBusinessMonth}
            initialContribution={editState.contribution}
            lockedReason={canMutateCurrentPeriod ? null : contributionRestrictionMessage}
            submitting={submitting}
            onClose={closeEditModal}
            onSubmit={handleSave}
          />
        </Suspense>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Eliminar aporte"
        description={
          pendingDelete
            ? `El aporte de ${pendingDelete.contributorName} en ${formatPeriodLabel(pendingDelete.month, pendingDelete.year)} dejará de mostrarse en el listado activo. Esta acción no borra el historial interno.`
            : ""
        }
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </div>
  );
};
