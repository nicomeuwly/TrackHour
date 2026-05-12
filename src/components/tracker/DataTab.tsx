"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useWeekEntries } from "@/lib/hooks/useWeekEntries";
import { useMonthEntries } from "@/lib/hooks/useMonthEntries";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import AdSenseUnit from "@/components/ads/AdSenseUnit";
import BalanceDisplay from "@/components/ui/BalanceDisplay";
import {
  getWeekDates,
  getMonthDates,
  localDateStr,
  formatMinutes,
} from "@/lib/business/calculations";
import {
  exportPeriodAsCSV,
  deletePeriodData,
  deleteAllData,
} from "@/lib/services/export.service";
import { exportData, importData } from "@/lib/services/backup.service";
import type { DayEntry, Settings } from "@/lib/types";

interface DataTabProps {
  onNavigateToDay?: (date: string) => void;
}

type CellStatus = "complete" | "incomplete" | "missing" | "weekend" | "future" | "vacation";

function getCellStatus(date: string, entry: DayEntry | undefined, settings: Settings, today: string): CellStatus {
  const dow = new Date(date + "T00:00:00").getDay();
  const isoDay = dow === 0 ? 7 : dow;
  if (!settings.workDays.includes(isoDay)) return "weekend";
  if (date > today) return "future";
  if (!entry) return "missing";
  if (entry.vacationMinutes > 0) return "vacation";
  if (entry.totalWorkedMinutes >= settings.expectedHoursPerDay * 60) return "complete";
  return "incomplete";
}


const CELL_BG: Record<CellStatus, string> = {
  complete: "bg-primary/10",
  incomplete: "bg-tertiary/10",
  missing: "bg-secondary/10",
  weekend: "bg-background-light",
  vacation: "bg-tertiary/15",
  future: "bg-background",
};

const STATUS_BADGE: Record<Exclude<CellStatus, "future">, string> = {
  complete: "bg-primary/15 text-primary",
  incomplete: "bg-tertiary/15 text-tertiary",
  missing: "bg-secondary/15 text-secondary",
  weekend: "bg-text/8 text-text/40",
  vacation: "bg-tertiary/20 text-tertiary",
};

type DeleteTarget =
  | { kind: "week"; start: string; end: string; label: string }
  | { kind: "month"; start: string; end: string; label: string }
  | { kind: "all" };

export default function DataTab({ onNavigateToDay }: DataTabProps) {
  const t = useTranslations("DataTab");
  const locale = useLocale();
  const today = localDateStr(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [refDate, setRefDate] = useState(today);
  const [deleteModal, setDeleteModal] = useState<DeleteTarget | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const { settings } = useSettings();
  const { showToast } = useToast();

  const refYear = parseInt(refDate.slice(0, 4));
  const refMonth = parseInt(refDate.slice(5, 7));
  const weekDates = getWeekDates(refDate);
  const monthDates = getMonthDates(refYear, refMonth);

  const { entries: weekEntries, weekBalance, isLoading: weekLoading, refresh: weekRefresh } =
    useWeekEntries(refDate);
  const { entries: monthEntries, monthBalance, isLoading: monthLoading, refresh: monthRefresh } =
    useMonthEntries(refYear, refMonth);

  // Locale-aware date helpers
  const DAY_LABELS = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 1 + i))
  );
  const DAY_HEADERS = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i))
  );

  function getWeekLabel(start: string, end: string): string {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).formatRange(s, e);
  }

  function getMonthLabel(year: number, month: number): string {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  }

  function shiftPeriod(delta: number) {
    const d = new Date(refDate + "T00:00:00");
    if (view === "week") {
      d.setDate(d.getDate() + delta * 7);
    } else {
      d.setDate(1);
      d.setMonth(d.getMonth() + delta);
    }
    setRefDate(localDateStr(d));
  }

  const isCurrentPeriod = view === "week"
    ? weekDates.start <= today && weekDates.end >= today
    : refYear === parseInt(today.slice(0, 4)) && refMonth === parseInt(today.slice(5, 7));

  const periodLabel = view === "week"
    ? getWeekLabel(weekDates.start, weekDates.end)
    : getMonthLabel(refYear, refMonth);

  const balance = view === "week" ? weekBalance : monthBalance;
  const isLoading = view === "week" ? weekLoading : monthLoading;

  const activeEntries = view === "week" ? weekEntries : monthEntries;
  const entriesByDate: Record<string, DayEntry> = {};
  for (const e of activeEntries) {
    entriesByDate[e.date] = e;
  }

  function refreshAll() {
    weekRefresh();
    monthRefresh();
  }

  async function handleExportCSV(type: "week" | "month") {
    try {
      const dates = type === "week" ? weekDates : monthDates;
      const label = type === "week"
        ? `week-${weekDates.start}`
        : `${new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(refYear, refMonth - 1, 1))}-${refYear}`;
      await exportPeriodAsCSV(dates.start, dates.end, label);
      showToast(t("toastExportCSV"), "success");
    } catch (e) {
      showToast(String(e), "error");
    }
  }

  async function handleExportJSON() {
    try {
      await exportData();
      showToast(t("toastExportJSON"), "success");
    } catch (e) {
      showToast(String(e), "error");
    }
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importData(file);
      if (result.success) {
        showToast(t("toastImported", { count: result.entriesImported }), "success");
      } else {
        showToast(result.errors[0] ?? "Import failed", "error");
      }
      refreshAll();
    } catch (err) {
      showToast(String(err), "error");
    }
    e.target.value = "";
  }

  async function handleDeleteConfirm() {
    if (!deleteModal) return;
    setIsProcessing(true);
    try {
      if (deleteModal.kind === "all") {
        await deleteAllData();
        showToast(t("toastDeletedAll"), "success");
      } else {
        const count = await deletePeriodData(deleteModal.start, deleteModal.end);
        showToast(t("toastDeleted", { count }), "success");
      }
      refreshAll();
      setDeleteModal(null);
    } catch (err) {
      showToast(String(err), "error");
    } finally {
      setIsProcessing(false);
    }
  }

  // Build the 7 dates for the week view list
  const weekDatesArr: string[] = [];
  const weekStart = new Date(weekDates.start + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDatesArr.push(localDateStr(d));
  }

  // Month calendar
  const daysInMonth = new Date(refYear, refMonth, 0).getDate();
  const firstDow = new Date(monthDates.start + "T00:00:00").getDay();
  const padCells = firstDow === 0 ? 6 : firstDow - 1;

  const avgMinutes = balance && balance.daysLogged > 0
    ? Math.round(balance.totalWorkedMinutes / balance.daysLogged)
    : 0;

  const vacationDaysCount = monthEntries.filter(e => e.vacationMinutes > 0).length;
  const completeDaysCount = settings
    ? monthEntries.filter(e => e.totalWorkedMinutes >= settings.expectedHoursPerDay * 60).length
    : 0;

  const STATUS_LABEL: Record<Exclude<CellStatus, "future">, string> = {
    complete: t("statusComplete"),
    incomplete: t("statusPartial"),
    missing: t("statusMissing"),
    weekend: t("statusWeekend"),
    vacation: t("statusVacation"),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Period header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-text/6 rounded-xl p-0.5">
            {(["week", "month"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? "bg-background shadow-sm text-text" : "text-text/50 hover:text-text"}`}
              >
                {v === "week" ? t("viewWeek") : t("viewMonth")}
              </button>
            ))}
          </div>
          {!isCurrentPeriod && (
            <button
              onClick={() => setRefDate(today)}
              className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/8 transition-colors"
            >
              {view === "week" ? t("thisWeek") : t("thisMonth")}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftPeriod(-1)} aria-label={view === "week" ? t("prevWeek") : t("prevMonth")}
            className="p-2 rounded-lg hover:bg-text/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <polyline points="10 4 6 8 10 12" />
            </svg>
          </button>
          <span className="flex-1 text-center text-sm font-semibold">{periodLabel}</span>
          <button onClick={() => shiftPeriod(1)} aria-label={view === "week" ? t("nextWeek") : t("nextMonth")}
            className="p-2 rounded-lg hover:bg-text/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <polyline points="6 4 10 8 6 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2-column layout on desktop: stats left, content right */}
      <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-start gap-6">

        {/* Left column: summary cards (1/3) */}
        <div className="h-full">
          {isLoading ? (
            <div className={"grid grid-cols-2 sm:grid-cols-1 gap-3 " + (view === "week" ? "sm:h-full" : "")}>
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl bg-text/5 animate-pulse" />)}
            </div>
          ) : (
            <div className={"grid grid-cols-2 sm:grid-cols-1 gap-3 " + (view === "week" ? "sm:h-full" : "sm:h-full")}>
              <div className="rounded-xl border border-text/10 bg-background px-4 py-3">
                <p className="text-xs text-text/50 mb-1">{t("totalWorked")}</p>
                <p className="font-bold text-base">{balance ? formatMinutes(balance.totalWorkedMinutes) : "—"}</p>
              </div>
              <div className="rounded-xl border border-text/10 bg-background px-4 py-3">
                <p className="text-xs text-text/50 mb-1">{t("balance")}</p>
                <p className="font-bold text-base">
                  {balance ? <BalanceDisplay balanceMinutes={balance.balanceMinutes} size="base" /> : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-text/10 bg-background px-4 py-3">
                <p className="text-xs text-text/50 mb-1">{t("daysLogged")}</p>
                <p className="font-bold text-base">
                  {balance ? `${balance.daysLogged} / ${balance.daysExpected}` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-text/10 bg-background px-4 py-3">
                <p className="text-xs text-text/50 mb-1">{t("avgPerDay")}</p>
                <p className="font-bold text-base">{avgMinutes > 0 ? formatMinutes(avgMinutes) : "—"}</p>
              </div>
              {view === "month" && (
                <div className="rounded-xl border border-text/10 bg-background px-4 py-3">
                  <p className="text-xs text-text/50 mb-1">{t("completeDays")}</p>
                  <p className="font-bold text-base">{completeDaysCount > 0 ? completeDaysCount + " / " + (balance ? balance.daysExpected : "—") : "—"}</p>
                </div>
              )}
              {view === "month" && (
                <div className="rounded-xl border border-text/10 bg-background px-4 py-3">
                  <p className="text-xs text-text/50 mb-1">{t("totalDaysOff")}</p>
                  <p className="font-bold text-base">{vacationDaysCount > 0 ? vacationDaysCount : "—"}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: week list or month calendar (2/3) */}
        <div className="sm:col-span-2">

          {/* Week day list */}
          {view === "week" && (
            weekLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-xl bg-text/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="rounded-xl border border-text/10 bg-background overflow-hidden divide-y divide-text/6">
                {weekDatesArr.map((date, i) => {
                  const entry = entriesByDate[date];
                  const status = settings ? getCellStatus(date, entry, settings, today) : "future";
                  const d = new Date(date + "T00:00:00");
                  const dayNum = d.getDate();
                  const balanceMinutes: number | null = (() => {
                    if (!settings || status === "weekend" || status === "future") return null;
                    const expectedMinutes = settings.expectedHoursPerDay * 60;
                    if (entry) {
                      const effectiveVacation = entry.vacationMinutes > 0 ? Math.max(0, expectedMinutes - entry.totalWorkedMinutes) : 0;
                      return entry.totalWorkedMinutes + effectiveVacation - expectedMinutes;
                    }
                    return -expectedMinutes;
                  })();

                  return (
                    <button
                      key={date}
                      onClick={() => onNavigateToDay?.(date)}
                      aria-label={d.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-text/5 transition-colors text-left ${status === "weekend" || status === "future" ? "opacity-55" : ""}`}
                    >
                      <div className="w-14 flex-none">
                        <p className={`text-sm capitalize font-semibold ${date === today ? "text-primary" : ""}`}>
                          {DAY_LABELS[i]} <span className="font-normal text-text/50">{dayNum}</span>
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        {entry ? (
                          <p className="text-sm font-medium">{formatMinutes(entry.totalWorkedMinutes)}</p>
                        ) : (
                          <p className="text-sm text-text/25">—</p>
                        )}
                      </div>
                      <div className="flex-none min-w-20 text-right">
                        {balanceMinutes !== null ? (
                          <BalanceDisplay balanceMinutes={balanceMinutes} />
                        ) : (
                          <span className="text-sm text-text/20">—</span>
                        )}
                      </div>
                      <div className="flex-none min-w-20">
                        {status !== "future" && (
                          <span className={`text-xs capitalize font-medium px-2 py-1 rounded-full ${STATUS_BADGE[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {/* Month calendar */}
          {view === "month" && (
            monthLoading ? (
              <div className="h-64 rounded-xl bg-text/5 animate-pulse" />
            ) : (
              <div>
                <div className="grid grid-cols-7 mb-1">
                  {DAY_HEADERS.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-text/40 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: padCells }).map((_, i) => <div key={`pad-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${refYear}-${String(refMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const entry = entriesByDate[dateStr];
                    const status = settings ? getCellStatus(dateStr, entry, settings, today) : "future";
                    const isToday = dateStr === today;

                    return (
                      <button
                        key={day}
                        onClick={() => onNavigateToDay?.(dateStr)}
                        aria-label={new Date(refYear, refMonth - 1, day).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                        className={`rounded-lg p-0.5 flex flex-col items-center justify-center aspect-square min-h-9.5 transition-colors dark:hover:brightness-140 hover:brightness-95 active:scale-95 ${CELL_BG[status]} ${isToday ? "ring-1 ring-primary ring-inset" : ""}`}
                      >
                        <span className={`text-xs font-semibold leading-none ${isToday ? "text-primary" : status === "future" ? "text-text/30" : ""}`}>
                          {day}
                        </span>
                        {entry && (
                          <span className="text-[10px] text-text/50 leading-none mt-0.5 tabular-nums">
                            {formatMinutes(entry.totalWorkedMinutes)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

        </div>
      </div>

      {/* AdSense */}
      <AdSenseUnit
        slot="XXXXXXXX"
        format={view === "month" ? "rectangle" : "horizontal"}
      />

      {/* Data management */}
      <div className="flex flex-col gap-5 pt-1">
        <h2 className="text-sm font-semibold">{t("manageData")}</h2>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-text/50 uppercase tracking-wide">{t("exportSection")}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleExportCSV("week")}
              className="text-sm border border-text/15 rounded-lg px-3 py-2 hover:bg-text/5 transition-colors">
              {t("exportWeekCSV")}
            </button>
            <button onClick={() => handleExportCSV("month")}
              className="text-sm border border-text/15 rounded-lg px-3 py-2 hover:bg-text/5 transition-colors">
              {t("exportMonthCSV")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportJSON}
              className="text-sm border border-text/15 rounded-lg px-3 py-2 hover:bg-text/5 transition-colors">
              {t("exportJSON")}
            </button>
            <button onClick={() => importRef.current?.click()}
              className="text-sm border border-text/15 rounded-lg px-3 py-2 hover:bg-text/5 transition-colors">
              {t("importJSON")}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="sr-only"
              aria-label={t("importAriaLabel")}
              onChange={handleImportChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-secondary uppercase tracking-wide">{t("deleteSection")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDeleteModal({ kind: "week", start: weekDates.start, end: weekDates.end, label: getWeekLabel(weekDates.start, weekDates.end) })}
              className="text-sm border border-secondary/30 text-secondary rounded-lg px-3 py-2 hover:bg-secondary/10 transition-colors"
            >
              {t("deleteWeek")}
            </button>
            <button
              onClick={() => setDeleteModal({ kind: "month", start: monthDates.start, end: monthDates.end, label: getMonthLabel(refYear, refMonth) })}
              className="text-sm border border-secondary/30 text-secondary rounded-lg px-3 py-2 hover:bg-secondary/10 transition-colors"
            >
              {t("deleteMonth")}
            </button>
            <button
              onClick={() => setDeleteModal({ kind: "all" })}
              className="text-sm border border-secondary/30 text-secondary rounded-lg px-3 py-2 hover:bg-secondary/10 transition-colors"
            >
              {t("deleteAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal
          isOpen
          onClose={() => { if (!isProcessing) setDeleteModal(null); }}
          title={t("deleteModalTitle")}
        >
          <div className="flex flex-col gap-5">
            <p className="text-sm text-text/70">
              {deleteModal.kind === "all"
                ? t("deleteAllConfirm")
                : deleteModal.kind === "week"
                  ? t("deleteWeekConfirm", { label: deleteModal.label })
                  : t("deleteMonthConfirm", { label: deleteModal.label })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium border border-text/15 rounded-lg hover:bg-text/5 transition-colors disabled:opacity-40"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium bg-secondary text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-40"
              >
                {isProcessing ? t("deleting") : t("delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
