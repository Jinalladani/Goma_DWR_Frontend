import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Eye, Filter, X } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";
import {
  getMyWorksheetsApi,
  getWorksheetDetailApi,
} from "../../api/worksheetApi";

export default function MyReports() {
  const [worksheets, setWorksheets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [entries, setEntries] = useState([]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });
  const pageSize = 5;

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyWorksheetsApi({
        page: currentPage,
        limit: pageSize,
        date_from: appliedFilters.dateFrom,
        date_to: appliedFilters.dateTo,
      });

      setWorksheets(res.worksheets || []);
      setTotalItems(res.pagination?.total_items || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters.dateFrom, appliedFilters.dateTo, currentPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadReports();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadReports]);

  const handleFilter = () => {
    setAppliedFilters({ dateFrom, dateTo });
    setCurrentPage(1);
  };

  const handleView = async (worksheetId) => {
    try {
      setLoading(true);
      const res = await getWorksheetDetailApi(worksheetId);

      setSelected(res.worksheet);
      setEntries(res.entries || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load report detail");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="MY REPORTS">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:mb-6 sm:p-5 md:grid-cols-[1fr_1fr_150px]">
          <DateInput
            label="Date From"
            value={dateFrom}
            onChange={setDateFrom}
          />

          <DateInput label="Date To" value={dateTo} onChange={setDateTo} />

          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <Loader message="Loading reports..." />
          ) : worksheets.length === 0 ? (
            <EmptyState title="No reports found." />
          ) : (
            worksheets.map((item, index) => (
              <MobileCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatDate(item.work_date)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {minutesToText(item.total_minutes)} total
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    #{(currentPage - 1) * pageSize + index + 1}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <ReportField label="Status">
                    <Badge value={item.status} />
                  </ReportField>
                  <ReportField label="Review">
                    <Badge value={item.review_status} />
                  </ReportField>
                  <ReportField label="Submitted" value={formatDateTime(item.submitted_at)} />
                  <ReportField label="Comment">
                    <TruncatedText value={item.review_comment} />
                  </ReportField>
                </div>
                <button
                  type="button"
                  onClick={() => handleView(item.id)}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  <Eye size={17} />
                  View Details
                </button>
              </MobileCard>
            ))
          )}
        </div>

        <div className="hidden md:block">
          <Table containerClassName="rounded-xl border border-slate-200">
            <thead>
              <tr className="bg-slate-50 text-sm text-slate-700">
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Total Hours</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Review</th>
                <th className="px-4 py-4">Submitted At</th>
                <th className="px-4 py-4">Comment</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {worksheets.map((item, index) => (
                <tr key={item.id} className="border-t text-sm">
                  <td className="px-4 py-5 font-bold">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>

                  <td className="px-4 py-5 font-semibold text-slate-900">
                    {formatDate(item.work_date)}
                  </td>

                  <td className="px-4 py-5 font-semibold">
                    {minutesToText(item.total_minutes)}
                  </td>

                  <td className="px-4 py-5">
                    <Badge value={item.status} />
                  </td>

                  <td className="px-4 py-5">
                    <Badge value={item.review_status} />
                  </td>

                  <td className="px-4 py-5 text-slate-600">
                    {formatDateTime(item.submitted_at)}
                  </td>

                  <td className="max-w-[260px] px-4 py-5 text-slate-600">
                    <TruncatedText value={item.review_comment} />
                  </td>

                  <td className="px-4 py-5">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleView(item.id)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && worksheets.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <EmptyState title="No reports found." />
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <Loader message="Loading reports..." />
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>

      {selected && (
        <Modal
          open={true}
          onClose={() => {
            setSelected(null);
            setEntries([]);
          }}
          maxWidth="max-w-6xl"
          panelClassName="overflow-hidden sm:rounded-3xl"
        >
            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-5 text-white sm:px-8 sm:py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">Report Detail</h2>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-medium">
                      {formatDate(selected.work_date)}
                    </span>

                    <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">
                      {selected.review_status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelected(null);
                    setEntries([]);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-slate-900"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 sm:max-h-[75vh] sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
                <InfoCard
                  label="Total Working Time"
                  value={minutesToText(selected.total_minutes)}
                  color="blue"
                />
                <InfoCard
                  label="Worksheet Status"
                  value={selected.status}
                  color="green"
                />
                <InfoCard
                  label="Review Status"
                  value={selected.review_status}
                  color="orange"
                />
                <InfoCard
                  label="Submitted At"
                  value={formatDateTime(selected.submitted_at)}
                  color="purple"
                />
              </div>

              <div className="mt-5 grid">
                {/* <TextPanel
                  label="Submitted Note"
                  value={selected.note}
                /> */}
                <TextPanel
                  label="Review Comment"
                  value={selected.review_comment}
                />
              </div>

              <div className="mt-5 space-y-3 md:hidden">
                {entries.length === 0 ? (
                  <EmptyState title="No entries found." />
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
                        <ReportField label="Start" value={formatTime(entry.start_time)} />
                        <ReportField label="Stop" value={formatTime(entry.stop_time)} />
                        <ReportField label="Total" value={minutesToText(entry.total_minutes)} />
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {entry.description || "-"}
                      </p>
                    </MobileCard>
                  ))
                )}
              </div>

              <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 md:block sm:mt-8">
                <Table minWidth="min-w-[900px]">
                    <thead className="bg-slate-100">
                      <tr className="text-sm font-semibold text-slate-700">
                        <th className="px-5 py-4">#</th>
                        <th className="px-5 py-4">Project</th>
                        <th className="px-5 py-4">Task</th>
                        <th className="px-5 py-4">Start</th>
                        <th className="px-5 py-4">Stop</th>
                        <th className="px-5 py-4">Total</th>
                        <th className="px-5 py-4">Description</th>
                      </tr>
                    </thead>

                    <tbody>
                      {entries.map((entry, index) => (
                        <tr
                          key={entry.id}
                          className="border-t border-slate-100 text-sm transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-5 font-bold text-slate-900">
                            {index + 1}
                          </td>

                          <td className="px-5 py-5 font-semibold text-slate-900">
                            {entry.project_name}
                          </td>

                          <td className="px-5 py-5 font-semibold text-slate-700">
                            {entry.task_title}
                          </td>

                          <td className="px-5 py-5 text-slate-600">
                            {formatTime(entry.start_time)}
                          </td>

                          <td className="px-5 py-5 text-slate-600">
                            {formatTime(entry.stop_time)}
                          </td>

                          <td className="px-5 py-5">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                              {minutesToText(entry.total_minutes)}
                            </span>
                          </td>

                          <td className="max-w-[300px] px-5 py-5 text-slate-600">
                            {entry.description || "-"}
                          </td>
                        </tr>
                      ))}

                      {entries.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="py-14 text-center text-slate-500"
                          >
                            <EmptyState title="No entries found." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                </Table>
              </div>

              {/* <div className="mt-5 flex justify-end sm:mt-8">
                <button
                  onClick={() => {
                    setSelected(null);
                    setEntries([]);
                  }}
                  className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Close Report
                </button>
              </div> */}
            </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4">
        <CalendarDays size={18} className="text-slate-400" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value, color }) {
  const colorClass = {
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    green: "border-green-100 bg-green-50 text-green-600",
    orange: "border-orange-100 bg-orange-50 text-orange-600",
    purple: "border-purple-100 bg-purple-50 text-purple-600",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colorClass[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <h3 className="mt-3 text-xl font-bold text-slate-900">{value || "-"}</h3>
    </div>
  );
}

function Badge({ value }) {
  const color =
    value === "APPROVED"
      ? "bg-green-50 text-green-700"
      : value === "REJECTED"
      ? "bg-red-50 text-red-700"
      : value === "SUBMITTED"
      ? "bg-blue-50 text-blue-700"
      : "bg-orange-50 text-orange-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {value || "-"}
    </span>
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

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return `${formatDate(value)} ${formatTime(value)}`;
}

function minutesToText(minutes) {
  const total = minutes || 0;
  const h = Math.floor(total / 60);
  const m = total % 60;

  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

function ReportField({ label, value, children }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      {children || <p className="text-slate-700">{value}</p>}
    </div>
  );
}

function TruncatedText({ value }) {
  if (!value) return <span>-</span>;

  return (
    <span
      className="block overflow-hidden text-slate-600"
      style={{
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
      }}
    >
      {value}
    </span>
  );
}

function TextPanel({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
        {value || "-"}
      </p>
    </div>
  );
}
