import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getUserReportCalendarApi } from "../api/userApi";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function EmployeeReportCalendarModal({
  employee,
  anchor,
  onClose,
  onSelectReport,
}) {
  const today = new Date();
  const employeeId = employee?.id;

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCalendar = useCallback(async () => {
    if (!employeeId) return;

    try {
      setLoading(true);

      const res = await getUserReportCalendarApi(employeeId, {
        month,
        year,
      });

      setReports(res.reports || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load report calendar"
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, year]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCalendar();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCalendar]);

  const reportByDate = useMemo(
    () => new Map(reports.map((report) => [report.work_date, report])),
    [reports]
  );

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const blankDays = firstDay.getDay();
    const days = [];

    for (let i = 0; i < blankDays; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(day);
    }

    return days;
  }, [month, year]);

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((current) => current - 1);
      return;
    }

    setMonth((current) => current - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((current) => current + 1);
      return;
    }

    setMonth((current) => current + 1);
  };

  const popoverStyle = getPopoverStyle(anchor);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute w-[calc(100vw-2rem)] max-w-[280px]"
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div
            className="absolute top-0 h-4 w-4 -translate-y-1/2 rotate-45 border-l border-t border-slate-200 bg-white"
            style={{ left: "calc(50% - 8px)" }}
          />

          <div className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-center">
                <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800">
                  {monthNames[month - 1]} {year}
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="py-1 text-[10px] font-bold uppercase text-slate-400"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`blank-${index}`} className="h-8 w-8" />;
                }

                const dateKey = formatDateKey(year, month, day);
                const report = reportByDate.get(dateKey);
                const isToday =
                  today.getFullYear() === year &&
                  today.getMonth() + 1 === month &&
                  today.getDate() === day;
                const dayClassName = getDayClassName(
                  report ? report.review_status || "PENDING" : undefined,
                  isToday
                );

                return report ? (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => onSelectReport?.(report.worksheet_id)}
                    title={`${report.review_status || "PENDING"} report`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition ${dayClassName}`}
                  >
                    {day}
                  </button>
                ) : (
                  <div
                    key={dateKey}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition ${dayClassName}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {loading && (
              <div className="mt-3 text-center text-xs text-slate-500">
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDayClassName(reviewStatus, isToday) {
  if (reviewStatus === "APPROVED") {
    return "bg-green-500 text-white hover:bg-green-600";
  }

  if (reviewStatus === "REJECTED") {
    return "bg-red-700 text-white hover:bg-red-800";
  }

  if (reviewStatus === "PENDING") {
    return "bg-red-100 text-red-700 hover:bg-red-200";
  }

  if (isToday) {
    return "bg-slate-100 text-slate-900 ring-1 ring-slate-300";
  }

  return "bg-white text-slate-700 hover:bg-slate-50";
}

function getPopoverStyle(anchor) {
  if (typeof window === "undefined" || !anchor) {
    return {
      top: "5rem",
      left: "1rem",
    };
  }

  if (window.innerWidth < 640) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const width = Math.min(280, window.innerWidth - 32);

  const left = Math.min(
    Math.max(anchor.left - width / 2, 16),
    window.innerWidth - width - 16
  );

  return {
    top: `${anchor.top}px`,
    left: `${left}px`,
  };
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}
