"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LEAVE_ICON } from "./leaveMeta";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useWeekEntries } from "@/lib/hooks/useWeekEntries";
import { useMonthEntries } from "@/lib/hooks/useMonthEntries";
import { useYearStats } from "@/lib/hooks/useYearStats";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useErrorMessage } from "@/lib/hooks/useErrorMessage";
import { AppError } from "@/lib/errors";
import Modal from "@/components/ui/Modal";
import BalanceDisplay from "@/components/ui/BalanceDisplay";
import Button from "@/components/ui/Button";
import Card, { StatCard } from "@/components/ui/Card";
import SegmentedControl from "@/components/ui/SegmentedControl";
import {
  getWeekDates,
  getMonthDates,
  localDateStr,
  formatMinutes,
  getCalendarDayStatus,
  dayRowBalance,
} from "@/lib/business/calculations";
import { useFirstTrackedDate } from "@/lib/hooks/useFirstTrackedDate";
import {
  exportPeriodAsCSV,
  deletePeriodData,
  deleteAllData,
} from "@/lib/services/export.service";
import { exportData, importData } from "@/lib/services/backup.service";
import type { DayEntry, CalendarDayStatus } from "@/lib/types";

interface DataTabProps {
  onNavigateToDay?: (date: string) => void;
}

type CellStatus = CalendarDayStatus;
// Days that are not actionable yet (or not tracked at all) carry no badge.
type BadgedStatus = Exclude<CellStatus, "future" | "untracked">;

function hasBadge(status: CellStatus): status is BadgedStatus {
  return status !== "future" && status !== "untracked";
}

const CELL_BG: Record<CellStatus, string> = {
  complete: "bg-primary/20 hover:brightness-85",
  incomplete: "bg-tertiary/20 hover:brightness-75",
  missing: "bg-secondary/10 hover:brightness-65",
  weekend: "bg-background-light hover:brightness-95",
  vacation: "bg-tertiary/15 hover:brightness-75",
  sick: "bg-secondary/15 hover:brightness-75",
  other: "bg-text/10 hover:brightness-95",
  compensation: "bg-primary/15 hover:brightness-85",
  future: "bg-background hover:brightness-95",
  untracked: "bg-background hover:brightness-95",
  inProgress: "bg-primary/10 hover:brightness-85",
};

const STATUS_BADGE: Record<BadgedStatus, string> = {
  inProgress: "bg-primary/10 text-primary",
  complete: "bg-primary/15 text-primary",
  incomplete: "bg-tertiary/15 text-tertiary",
  missing: "bg-secondary/15 text-secondary",
  weekend: "bg-text/8 text-text/40",
  vacation: "bg-tertiary/20 text-tertiary",
  sick: "bg-secondary/15 text-secondary",
  other: "bg-text/10 text-text/50",
  compensation: "bg-primary/15 text-primary",
};

// Leave days share colors with other statuses (vacation/partial are both amber),
// so their icon is what tells them apart, not color alone.
function leaveIconFor(status: CellStatus) {
  return status in LEAVE_ICON ? LEAVE_ICON[status as keyof typeof LEAVE_ICON] : null;
}

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
  // The target outlives the open flag so the modal keeps its content while it animates out.
  const [deleteModal, setDeleteModal] = useState<DeleteTarget | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  function openDeleteModal(target: DeleteTarget) {
    setDeleteModal(target);
    setIsDeleteOpen(true);
  }
  const [isProcessing, setIsProcessing] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const { settings } = useSettings();
  const { showToast } = useToast();
  const formatError = useErrorMessage();
  const { firstTrackedDate, refresh: firstTrackedRefresh } = useFirstTrackedDate();

  const refYear = parseInt(refDate.slice(0, 4));
  const refMonth = parseInt(refDate.slice(5, 7));
  const weekDates = getWeekDates(refDate);
  const monthDates = getMonthDates(refYear, refMonth);

  const { entries: weekEntries, weekBalance, isLoading: weekLoading, refresh: weekRefresh } =
    useWeekEntries(refDate);
  const { entries: monthEntries, monthBalance, isLoading: monthLoading, refresh: monthRefresh } =
    useMonthEntries(refYear, refMonth);
  const { overtimeMinutes: yearOvertime, absenceOvertimeMinutes: yearAbsenceOvertime, absenceDays: yearAbsences, vacationUsed: yearVacationUsed, workedDays: yearWorkedDays, totalWorkdays: yearTotalWorkdays, refresh: yearRefresh } =
    useYearStats(refYear, settings);

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
    yearRefresh();
    firstTrackedRefresh();
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
      showToast(formatError(e), "error");
    }
  }

  async function handleExportJSON() {
    try {
      await exportData();
      showToast(t("toastExportJSON"), "success");
    } catch (e) {
      showToast(formatError(e), "error");
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
        showToast(formatError(result.errors[0] ?? new AppError("importFailed", { detail: "" })), "error");
      }
      refreshAll();
    } catch (err) {
      showToast(formatError(err), "error");
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
      setIsDeleteOpen(false);
    } catch (err) {
      showToast(formatError(err), "error");
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

  const daysOffCount = monthEntries.filter(e => e.leaveType !== null).length;
  const completeDaysCount = settings
    ? monthEntries.filter(e => e.totalWorkedMinutes >= settings.expectedHoursPerDay * 60).length
    : 0;

  const STATUS_LABEL: Record<BadgedStatus, string> = {
    inProgress: t("statusInProgress"),
    complete: t("statusComplete"),
    incomplete: t("statusPartial"),
    missing: t("statusMissing"),
    weekend: t("statusWeekend"),
    vacation: t("statusVacation"),
    sick: t("statusSick"),
    other: t("statusOther"),
    compensation: t("statusCompensation"),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Period header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <SegmentedControl
            options={[{ value: "week", label: t("viewWeek") }, { value: "month", label: t("viewMonth") }]}
            value={view}
            onChange={setView}
          />
          {!isCurrentPeriod && (
            <Button variant="outline-primary" size="chip" onClick={() => setRefDate(today)}>
              {view === "week" ? t("thisWeek") : t("thisMonth")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => shiftPeriod(-1)} aria-label={view === "week" ? t("prevWeek") : t("prevMonth")}>
            <ChevronLeft size={16} aria-hidden />
          </Button>
          <span className="flex-1 text-center text-sm font-semibold capitalize">{periodLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => shiftPeriod(1)} aria-label={view === "week" ? t("nextWeek") : t("nextMonth")}>
            <ChevronRight size={16} aria-hidden />
          </Button>
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
              <StatCard label={t("totalWorked")}>
                {balance ? `${formatMinutes(balance.totalWorkedMinutes)} / ${formatMinutes(balance.totalExpectedMinutes)}` : "—"}
              </StatCard>
              <StatCard label={t("balance")}>
                {balance ? <BalanceDisplay balanceMinutes={balance.balanceMinutes} size="base" /> : "—"}
              </StatCard>
              <StatCard label={t("daysLogged")}>
                {balance ? `${balance.daysLogged} / ${balance.daysExpected}` : "—"}
              </StatCard>
              <StatCard label={t("avgPerDay")}>
                {avgMinutes > 0 ? formatMinutes(avgMinutes) : "—"}
              </StatCard>
              {view === "month" && (
                <StatCard label={t("completeDays")}>
                  {completeDaysCount > 0 ? completeDaysCount + " / " + (balance ? balance.daysExpected : "—") : "—"}
                </StatCard>
              )}
              {view === "month" && (
                <StatCard label={t("totalDaysOff")}>
                  {daysOffCount > 0 ? daysOffCount : "—"}
                </StatCard>
              )}
              {/* Always positive: time worked during covered absences. Compensation is
                  excluded since time worked there only reduces the deduction (+/-). */}
              {view === "month" && (
                <StatCard label={t("absenceOvertime")}>
                  {balance && balance.absenceOvertimeMinutes > 0
                    ? <BalanceDisplay balanceMinutes={balance.absenceOvertimeMinutes} size="base" />
                    : "—"}
                </StatCard>
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
              <Card padding="none" className="overflow-hidden divide-y divide-text/6">
                {weekDatesArr.map((date, i) => {
                  const entry = entriesByDate[date];
                  const status = settings ? getCalendarDayStatus(date, entry, settings, today, firstTrackedDate) : "future";
                  const d = new Date(date + "T00:00:00");
                  const dayNum = d.getDate();
                  // Same rule as the period balance: only settled, logged days show a balance.
                  const balanceMinutes = settings ? dayRowBalance(date, entry, settings, today) : null;

                  return (
                    <button
                      key={date}
                      onClick={() => onNavigateToDay?.(date)}
                      aria-label={d.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-text/5 active:scale-100 active:bg-text/8 text-left ${status === "weekend" || !hasBadge(status) ? "opacity-55" : ""}`}
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
                          <p className="text-sm text-text/45">—</p>
                        )}
                      </div>
                      <div className="flex-none min-w-20 text-right">
                        {balanceMinutes !== null ? (
                          <BalanceDisplay balanceMinutes={balanceMinutes} />
                        ) : (
                          <span className="text-sm text-text/45">—</span>
                        )}
                      </div>
                      <div className="flex-none min-w-20">
                        {hasBadge(status) && (() => {
                          const LeaveIcon = leaveIconFor(status);
                          return (
                            <span className={`inline-flex items-center gap-1 text-xs capitalize font-medium px-2 py-1 rounded-full ${STATUS_BADGE[status]}`}>
                              {LeaveIcon && <LeaveIcon size={11} aria-hidden />}
                              {STATUS_LABEL[status]}
                            </span>
                          );
                        })()}
                      </div>
                    </button>
                  );
                })}
              </Card>
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
                    <div key={i} className="text-center text-xs font-medium text-text-muted py-1" aria-hidden>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: padCells }).map((_, i) => <div key={`pad-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${refYear}-${String(refMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const entry = entriesByDate[dateStr];
                    const status = settings ? getCalendarDayStatus(dateStr, entry, settings, today, firstTrackedDate) : "future";
                    const isToday = dateStr === today;
                    const LeaveIcon = leaveIconFor(status);

                    return (
                      <button
                        key={day}
                        onClick={() => onNavigateToDay?.(dateStr)}
                        aria-label={new Date(refYear, refMonth - 1, day).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                        className={`rounded-lg p-0.5 flex flex-col items-center justify-center aspect-square min-h-9.5 dark:hover:brightness-140 ${CELL_BG[status]} ${isToday ? "ring-1 ring-primary ring-inset" : ""}`}
                      >
                        <span className={`text-xs font-semibold leading-none ${isToday ? "text-primary" : !hasBadge(status) ? "text-text/45" : ""}`}>
                          {day}
                        </span>
                        {LeaveIcon ? (
                          <LeaveIcon size={11} aria-hidden className="mt-0.5 text-text/60" />
                        ) : entry && (
                          <span className="text-[11px] text-text/70 leading-none mt-0.5 tabular-nums">
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

      {/* Annual summary — always visible, independent of week/month view */}
      <div className="flex flex-col gap-3 pt-1">
        <h2 className="text-sm font-semibold">{t("yearSection", { year: String(refYear) })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label={t("yearWorkedDays")}>
            {yearWorkedDays} / {yearTotalWorkdays}
          </StatCard>
          <StatCard label={t("yearOvertime")}>
            <BalanceDisplay balanceMinutes={yearOvertime} size="base" />
          </StatCard>
          <StatCard label={t("absenceOvertime")}>
            {yearAbsenceOvertime > 0 ? <BalanceDisplay balanceMinutes={yearAbsenceOvertime} size="base" /> : "—"}
          </StatCard>
          <StatCard label={t("yearAbsences")}>
            {t("yearAbsencesValue", { count: yearAbsences })}
          </StatCard>
          <StatCard label={t("yearVacation")}>
            {yearVacationUsed} / {settings?.annualVacationDays ?? 0} {t("daysUnit")}
          </StatCard>
        </div>
      </div>

      {/* Data management */}
      <div className="flex flex-col gap-5 pt-1">
        <h2 className="text-sm font-semibold">{t("manageData")}</h2>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-text/50 uppercase tracking-wide">{t("exportSection")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleExportCSV("week")}>
              {t("exportWeekCSV")}
            </Button>
            <Button variant="outline" onClick={() => handleExportCSV("month")}>
              {t("exportMonthCSV")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportJSON}>
              {t("exportJSON")}
            </Button>
            <Button variant="outline" onClick={() => importRef.current?.click()}>
              {t("importJSON")}
            </Button>
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
            <Button
              variant="outline-danger"
              onClick={() => openDeleteModal({ kind: "week", start: weekDates.start, end: weekDates.end, label: getWeekLabel(weekDates.start, weekDates.end) })}
            >
              {t("deleteWeek")}
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => openDeleteModal({ kind: "month", start: monthDates.start, end: monthDates.end, label: getMonthLabel(refYear, refMonth) })}
            >
              {t("deleteMonth")}
            </Button>
            <Button variant="outline-danger" onClick={() => openDeleteModal({ kind: "all" })}>
              {t("deleteAll")}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => { if (!isProcessing) setIsDeleteOpen(false); }}
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
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isProcessing}>
                {t("cancel")}
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={isProcessing}>
                {isProcessing ? t("deleting") : t("delete")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
