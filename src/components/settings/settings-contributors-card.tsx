import { Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useState, type MouseEvent } from "react";
import {
  Check,
  Clock3,
  Edit2,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  Trash2,
  UserX,
  Users
} from "lucide-react";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ContributorAuth0StatusBadge, ContributorStatusBadge } from "../ui/state-badge";
import type { Contributor } from "../../types/domain";

type SettingsContributorsCardProps = {
  contributors: Contributor[];
  canEdit: boolean;
  onCreateContributor: () => void;
  onEditContributor: (contributor: Contributor) => void;
  onToggleContributorStatus: (contributor: Contributor) => void;
};

type FloatingPanelPosition = {
  top: number;
  left: number;
  originClassName: string;
};

type MobileActionsOverlay = {
  contributor: Contributor;
  position: FloatingPanelPosition;
};

type MobileAccessOverlay = {
  contributor: Contributor;
  position: FloatingPanelPosition;
};

const VIEWPORT_MARGIN = 12;
const FLOATING_PANEL_GAP = 8;
const MOBILE_ACTIONS_PANEL_WIDTH = 184;
const MOBILE_ACCESS_PANEL_WIDTH = 176;

const getFloatingPanelPosition = (
  rect: DOMRect,
  panelWidth: number,
  estimatedPanelHeight: number
): FloatingPanelPosition => {
  const left = Math.min(
    Math.max(rect.right - panelWidth, VIEWPORT_MARGIN),
    window.innerWidth - panelWidth - VIEWPORT_MARGIN
  );

  const openBelow = rect.bottom + FLOATING_PANEL_GAP + estimatedPanelHeight <= window.innerHeight - VIEWPORT_MARGIN;

  return {
    left,
    top: openBelow
      ? rect.bottom + FLOATING_PANEL_GAP
      : Math.max(VIEWPORT_MARGIN, rect.top - estimatedPanelHeight - FLOATING_PANEL_GAP),
    originClassName: openBelow ? "origin-top-right" : "origin-bottom-right"
  };
};

export const SettingsContributorsCard = ({
  contributors,
  canEdit,
  onCreateContributor,
  onEditContributor,
  onToggleContributorStatus
}: SettingsContributorsCardProps) => {
  const [mobileActionsOverlay, setMobileActionsOverlay] = useState<MobileActionsOverlay | null>(null);
  const [mobileAccessOverlay, setMobileAccessOverlay] = useState<MobileAccessOverlay | null>(null);

  useEffect(() => {
    if (!mobileActionsOverlay && !mobileAccessOverlay) {
      return;
    }

    const closeFloatingPanels = () => {
      setMobileActionsOverlay(null);
      setMobileAccessOverlay(null);
    };

    window.addEventListener("resize", closeFloatingPanels);
    window.addEventListener("scroll", closeFloatingPanels, true);

    return () => {
      window.removeEventListener("resize", closeFloatingPanels);
      window.removeEventListener("scroll", closeFloatingPanels, true);
    };
  }, [mobileActionsOverlay, mobileAccessOverlay]);

  const getAccessStatusText = (contributor: Contributor) => {
    switch (contributor.auth0SyncStatus) {
      case "linked":
        return "Con cuenta";
      case "pending_password":
        return "Pendiente de contraseña";
      case "not_linked":
        return "Sin cuenta";
      case "no_access":
        return "Sin permisos";
      case "error":
        return "Error de sincronización";
      default:
        return "";
    }
  };

  const getMobileAccessIcon = (contributor: Contributor) => {
    switch (contributor.auth0SyncStatus) {
      case "linked":
        return <ShieldCheck size={16} className="text-success-700 dark:text-success-400" aria-hidden="true" />;
      case "pending_password":
        return <Clock3 size={16} className="text-warning-700 dark:text-warning-400" aria-hidden="true" />;
      case "not_linked":
        return <UserX size={16} className="text-primary-700 dark:text-primary-400" aria-hidden="true" />;
      case "no_access":
        return <ShieldX size={16} className="text-neutral-700 dark:text-neutral-300" aria-hidden="true" />;
      case "error":
        return <TriangleAlert size={16} className="text-danger-700 dark:text-danger-400" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const closeFloatingPanels = () => {
    setMobileActionsOverlay(null);
    setMobileAccessOverlay(null);
  };

  const openMobileActions = (contributor: Contributor, event: MouseEvent<HTMLButtonElement>) => {
    const triggerRect = event.currentTarget.getBoundingClientRect();

    setMobileAccessOverlay(null);
    setMobileActionsOverlay((current) =>
      current?.contributor.id === contributor.id
        ? null
        : {
            contributor,
            position: getFloatingPanelPosition(
              triggerRect,
              MOBILE_ACTIONS_PANEL_WIDTH,
              contributor.status === 1 ? 112 : 64
            )
          }
    );
  };

  const openMobileAccess = (contributor: Contributor, event: MouseEvent<HTMLButtonElement>) => {
    const triggerRect = event.currentTarget.getBoundingClientRect();

    setMobileActionsOverlay(null);
    setMobileAccessOverlay((current) =>
      current?.contributor.id === contributor.id
        ? null
        : {
            contributor,
            position: getFloatingPanelPosition(
              triggerRect,
              MOBILE_ACCESS_PANEL_WIDTH,
              contributor.auth0SyncStatus === "error" && contributor.auth0LastError?.trim() ? 112 : 72
            )
          }
    );
  };

  const renderMobileAccessStatus = (contributor: Contributor) => {
    if (contributor.auth0SyncStatus === "unknown_legacy") {
      return null;
    }

    const statusText = getAccessStatusText(contributor);

    return (
      <button
        type="button"
        onClick={(event) => openMobileAccess(contributor, event)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary-100 bg-white/90 text-neutral-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:border-primary-500 dark:hover:bg-primary-900/10"
        aria-label={`Ver estado de acceso: ${statusText}`}
        aria-expanded={mobileAccessOverlay?.contributor.id === contributor.id}
        title={statusText}
      >
        {getMobileAccessIcon(contributor)}
      </button>
    );
  };

  const renderAccessStatus = (contributor: Contributor) => {
    if (contributor.auth0SyncStatus === "unknown_legacy") {
      return null;
    }

    if (contributor.auth0SyncStatus === "linked") {
      return (
        <span title="Con cuenta">
          <ShieldCheck
            size={16}
            className="text-success-700 dark:text-success-400"
            aria-label="Con cuenta"
          />
        </span>
      );
    }

    if (contributor.auth0SyncStatus === "pending_password") {
      return <ContributorAuth0StatusBadge status={contributor.auth0SyncStatus} />;
    }

    return <ContributorAuth0StatusBadge status={contributor.auth0SyncStatus} />;
  };

  return (
    <>
      <Card
        className="overflow-visible border-primary-200 bg-[var(--gradient-surface)] shadow-card dark:border-neutral-700"
        header={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary-700" />
                Lista de Contribuyentes
              </div>
              <span className="rounded-full border border-primary-200 bg-[rgba(255,255,255,0.92)] px-2.5 py-1 text-[11px] font-bold text-neutral-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300 sm:hidden">
                {contributors.length}
              </span>
            </div>

            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-2">
              <span className="hidden rounded-full border border-primary-200 bg-[rgba(255,255,255,0.92)] px-2.5 py-1 text-[11px] font-bold text-neutral-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300 sm:inline-block">
                {contributors.length} registros
              </span>
              <Button size="sm" icon={Plus} onClick={onCreateContributor} disabled={!canEdit} className="w-full text-[13px] sm:w-auto sm:text-sm">
                Nuevo contribuyente
              </Button>
            </div>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/60 dark:bg-primary-900/20">
              <tr>
                <th className="px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 sm:px-4 md:px-6">Nombres</th>
                <th className="pl-2 pr-1 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 sm:px-4 md:px-6">Estado</th>
                <th className="hidden px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 sm:px-4 lg:table-cell lg:px-6">Acceso</th>
                <th className="pl-1 pr-2 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 sm:px-4 sm:text-left md:px-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-white/5">
              {contributors.map((contributor) => (
                <tr key={contributor.id} className="group transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                  <td className="px-2 py-3.5 sm:px-4 md:px-6">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold leading-tight text-neutral-900 dark:text-neutral-100">{contributor.name}</div>
                        {contributor.auth0SyncStatus !== "unknown_legacy" ? (
                          <div className="shrink-0 lg:hidden">{renderMobileAccessStatus(contributor)}</div>
                        ) : null}
                      </div>
                      {contributor.email?.trim() ? (
                        <div className="mt-0.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                          {contributor.email}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="pl-2 pr-1 py-3.5 text-center align-top sm:px-4 md:px-6">
                    <div className="flex justify-center">
                      <ContributorStatusBadge status={contributor.status} />
                    </div>
                  </td>
                  <td className="hidden px-2 py-3.5 sm:px-4 lg:table-cell lg:px-6">
                    <div className="space-y-1">
                      {renderAccessStatus(contributor)}
                      {contributor.auth0SyncStatus === "error" && contributor.auth0LastError?.trim() ? (
                        <p className="max-w-[240px] truncate text-[10px] font-medium text-danger-700 dark:text-danger-400" title={contributor.auth0LastError}>
                          {contributor.auth0LastError}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="pl-1 pr-2 py-3.5 align-top sm:px-4 md:px-6">
                    <div className="flex justify-end md:hidden">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={(event) => openMobileActions(contributor, event)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-100 bg-white/90 text-neutral-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:border-primary-500 dark:hover:bg-primary-900/10"
                        aria-label="Ver acciones del contribuyente"
                        aria-expanded={mobileActionsOverlay?.contributor.id === contributor.id}
                        title="Ver acciones del contribuyente"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div className="hidden items-start justify-start gap-2 md:flex">
                      {contributor.status === 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          disabled={!canEdit}
                          onClick={() => onEditContributor(contributor)}
                          aria-label="Editar contribuyente"
                          title="Editar contribuyente"
                        />
                      )}
                      <Button
                        size="sm"
                        variant={contributor.status === 1 ? "outline" : "secondary"}
                        icon={contributor.status === 1 ? Trash2 : Check}
                        disabled={!canEdit}
                        onClick={() => onToggleContributorStatus(contributor)}
                        className={`whitespace-nowrap ${contributor.status === 1 ? "!px-2.5 !border-danger-300 !bg-danger-50/80 !text-danger-700 hover:!border-danger-400 hover:!bg-danger-100 dark:!border-danger-700/70 dark:!bg-danger-900/25 dark:!text-danger-300 dark:hover:!bg-danger-900/40" : ""}`}
                        aria-label={contributor.status === 1 ? "Desactivar contribuyente" : "Activar contribuyente"}
                        title={contributor.status === 1 ? "Desactivar contribuyente" : "Activar contribuyente"}
                      >
                        {contributor.status === 1 ? null : "Activar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Transition appear show={mobileAccessOverlay !== null} as={Fragment}>
        <div className="md:hidden">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-40" onClick={closeFloatingPanels} aria-hidden="true" />
          </TransitionChild>
          {mobileAccessOverlay ? (
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-120"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-90"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div
                className={`fixed z-50 w-44 rounded-2xl border border-border bg-white p-3 text-left shadow-[var(--shadow-dropdown)] ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-white/5 ${mobileAccessOverlay.position.originClassName}`}
                style={{
                  left: mobileAccessOverlay.position.left,
                  top: mobileAccessOverlay.position.top
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                  Acceso
                </p>
                <p className="mt-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {getAccessStatusText(mobileAccessOverlay.contributor)}
                </p>
                {mobileAccessOverlay.contributor.auth0SyncStatus === "error" &&
                mobileAccessOverlay.contributor.auth0LastError?.trim() ? (
                  <p className="mt-1 text-[11px] leading-4 text-danger-700 dark:text-danger-400">
                    {mobileAccessOverlay.contributor.auth0LastError}
                  </p>
                ) : null}
              </div>
            </TransitionChild>
          ) : null}
        </div>
      </Transition>

      <Transition appear show={mobileActionsOverlay !== null} as={Fragment}>
        <div className="md:hidden">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-40" onClick={closeFloatingPanels} aria-hidden="true" />
          </TransitionChild>
          {mobileActionsOverlay ? (
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-120"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-90"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div
                className={`fixed z-50 w-[184px] rounded-2xl border border-border bg-white p-2 shadow-[var(--shadow-dropdown)] ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-white/5 ${mobileActionsOverlay.position.originClassName}`}
                style={{
                  left: mobileActionsOverlay.position.left,
                  top: mobileActionsOverlay.position.top
                }}
              >
                {mobileActionsOverlay.contributor.status === 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const contributor = mobileActionsOverlay.contributor;
                      closeFloatingPanels();
                      onEditContributor(contributor);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-neutral-700 transition hover:bg-primary-50 hover:text-primary-700 dark:text-neutral-300 dark:hover:bg-primary-900/40 dark:hover:text-primary-300"
                  >
                    <Edit2 size={16} className="text-primary-600" />
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const contributor = mobileActionsOverlay.contributor;
                    closeFloatingPanels();
                    onToggleContributorStatus(contributor);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                    mobileActionsOverlay.contributor.status === 1
                      ? "text-danger-700 hover:bg-danger-50 dark:text-danger-300 dark:hover:bg-danger-900/40"
                      : "text-neutral-700 hover:bg-primary-50 hover:text-primary-700 dark:text-neutral-300 dark:hover:bg-primary-900/40 dark:hover:text-primary-300"
                  }`}
                >
                  {mobileActionsOverlay.contributor.status === 1 ? (
                    <Trash2 size={16} className="text-danger-600 dark:text-danger-400" />
                  ) : (
                    <Check size={16} className="text-primary-600" />
                  )}
                  {mobileActionsOverlay.contributor.status === 1 ? "Desactivar" : "Activar"}
                </button>
              </div>
            </TransitionChild>
          ) : null}
        </div>
      </Transition>
    </>
  );
};
