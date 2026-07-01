import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, X, XCircle } from "lucide-react";

import {
  getAdminWorksheetDetailApi,
  reviewWorksheetApi,
} from "../api/adminWorksheetApi";
import EmptyState from "./EmptyState";
import Loader from "./Loader";
import MobileCard from "./MobileCard";
import Modal from "./Modal";
import Table from "./Table";
import { getUser } from "../utils/auth";

export default function WorksheetReviewModal({
  open,
  worksheetId,
  onClose,
  onReviewed,
}) {
  const [worksheet, setWorksheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [workerEntries, setWorkerEntries] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const currentUser = getUser();
  const isOwnAdminWorksheet =
    currentUser?.role === "ADMIN" &&
    Number(currentUser?.id) === Number(worksheet?.employee_id);

  const loadWorksheet = useCallback(async () => {
    if (!worksheetId) return;

    try {
      setLoading(true);
      const res = await getAdminWorksheetDetailApi(worksheetId);

      setWorksheet(res.worksheet);
      setEntries(res.entries || []);
      setWorkerEntries(res.worker_entries || []);
      setComment(res.worksheet?.review_comment || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load report detail");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose, worksheetId]);

  useEffect(() => {
    if (!open || !worksheetId) return undefined;

    const timeoutId = window.setTimeout(() => {
      loadWorksheet();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWorksheet, open, worksheetId]);

  const handleReview = async (status) => {
    if (!worksheet) return;

    if (status === "REJECTED" && !comment.trim()) {
      toast.error("Review comment is required when rejecting worksheet");
      return;
    }

    try {
      setLoading(true);

      await reviewWorksheetApi(worksheet.id, {
        review_status: status,
        review_comment: comment,
      });

      toast.success(`Worksheet ${status.toLowerCase()} successfully`);
      await onReviewed?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Review failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={loading ? undefined : onClose}>
      <div className="p-4 sm:p-6">
        {loading && !worksheet ? (
          <Loader message="Loading report detail..." />
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Report Detail
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {worksheet?.employee_name || "-"} - {formatDate(worksheet?.work_date)}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border p-2 hover:bg-slate-50 disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
              <InfoCard label="Employee Work" value={minutesToText(sumMinutes(entries))} />
              <InfoCard label="Worker Work" value={minutesToText(sumMinutes(workerEntries))} />
              <InfoCard label="Grand Total" value={minutesToText(worksheet?.total_minutes)} />
              <InfoCard label="Status" value={worksheet?.status} />
              <InfoCard label="Review" value={worksheet?.review_status} />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Employee Note
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {worksheet?.note || "-"}
              </p>
            </div>

            <SectionTitle
              title="Employee Work Entries"
              subtitle={`${entries.length} entries`}
            />

            <div className="space-y-3 md:hidden">
              {entries.length === 0 ? (
                <EmptyState title="No employee entries found." />
              ) : (
                entries.map((entry, index) => (
                  <MobileCard key={entry.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {entry.task_title || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {entry.project_name || "-"}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                      <EntryField label="Start" value={formatTime(entry.start_time)} />
                      <EntryField label="Stop" value={formatTime(entry.stop_time)} />
                      <EntryField label="Total" value={minutesToText(entry.total_minutes)} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {entry.description || "-"}
                    </p>
                  </MobileCard>
                ))
              )}
            </div>

            <div className="hidden md:block">
              <Table minWidth="min-w-[850px]" containerClassName="mt-6 rounded-xl border">
              <thead>
                <tr className="bg-slate-50 text-sm text-slate-700">
                  <th className="px-4 py-4">#</th>
                  <th className="px-4 py-4">Project</th>
                  <th className="px-4 py-4">Task</th>
                  <th className="px-4 py-4">Start</th>
                  <th className="px-4 py-4">Stop</th>
                  <th className="px-4 py-4">Total</th>
                  <th className="px-4 py-4">Description</th>
                </tr>
              </thead>

              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id} className="border-t text-sm">
                    <td className="px-4 py-4 font-bold">{index + 1}</td>
                    <td className="px-4 py-4">{entry.project_name || "-"}</td>
                    <td className="px-4 py-4 font-semibold">{entry.task_title || "-"}</td>
                    <td className="px-4 py-4">{formatTime(entry.start_time)}</td>
                    <td className="px-4 py-4">{formatTime(entry.stop_time)}</td>
                    <td className="px-4 py-4">{minutesToText(entry.total_minutes)}</td>
                    <td className="max-w-[280px] px-4 py-4 text-slate-600">
                      {entry.description || "-"}
                    </td>
                  </tr>
                ))}

                {entries.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-500">
                      <EmptyState title="No employee entries found." />
                    </td>
                  </tr>
                )}
              </tbody>
              </Table>
            </div>

            <SectionTitle
              title="Worker Work Entries"
              subtitle={`${workerEntries.length} entries`}
            />

            <div className="space-y-3 md:hidden">
              {workerEntries.length === 0 ? (
                <EmptyState title="No worker entries found." />
              ) : (
                workerEntries.map((entry, index) => (
                  <MobileCard key={entry.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {entry.worker_name || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {entry.project_name || "-"}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      {entry.work_type || "-"} - {entry.task_title || "-"}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                      <EntryField label="Start" value={formatTime(entry.start_time)} />
                      <EntryField label="End" value={formatTime(entry.end_time)} />
                      <EntryField label="Total" value={minutesToText(entry.total_minutes)} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {entry.description || "-"}
                    </p>
                  </MobileCard>
                ))
              )}
            </div>

            <div className="hidden md:block">
              <Table minWidth="min-w-[950px]" containerClassName="mt-3 rounded-xl border">
                <thead>
                  <tr className="bg-slate-50 text-sm text-slate-700">
                    <th className="px-4 py-4">#</th>
                    <th className="px-4 py-4">Worker</th>
                    <th className="px-4 py-4">Project</th>
                    <th className="px-4 py-4">Work Type</th>
                    <th className="px-4 py-4">Task</th>
                    <th className="px-4 py-4">Start</th>
                    <th className="px-4 py-4">End</th>
                    <th className="px-4 py-4">Total</th>
                    <th className="px-4 py-4">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {workerEntries.map((entry, index) => (
                    <tr key={entry.id} className="border-t text-sm">
                      <td className="px-4 py-4 font-bold">{index + 1}</td>
                      <td className="px-4 py-4 font-semibold">{entry.worker_name || "-"}</td>
                      <td className="px-4 py-4">{entry.project_name || "-"}</td>
                      <td className="px-4 py-4">{entry.work_type || "-"}</td>
                      <td className="px-4 py-4">{entry.task_title || "-"}</td>
                      <td className="px-4 py-4">{formatTime(entry.start_time)}</td>
                      <td className="px-4 py-4">{formatTime(entry.end_time)}</td>
                      <td className="px-4 py-4">{minutesToText(entry.total_minutes)}</td>
                      <td className="max-w-[260px] px-4 py-4 text-slate-600">
                        {entry.description || "-"}
                      </td>
                    </tr>
                  ))}

                  {workerEntries.length === 0 && (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-slate-500">
                        <EmptyState title="No worker entries found." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Review Comment
              </label>
              <textarea
                rows="3"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500"
                placeholder="Write review comment..."
              />
            </div>

            {isOwnAdminWorksheet ? (
              <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
                You cannot review your own worksheet. Super Admin approval required.
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleReview("REJECTED")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  <XCircle size={20} />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() => handleReview("APPROVED")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCircle size={20} />
                  Approve
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-bold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-3 mt-6">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function EntryField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-slate-700">{value}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month},${year}`;
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function minutesToText(minutes) {
  const total = minutes || 0;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(hours).padStart(2, "0")}h ${String(remainder).padStart(2, "0")}m`;
}

function sumMinutes(items) {
  return items.reduce((total, item) => total + (item.total_minutes || 0), 0);
}
