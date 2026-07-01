import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Clock3, Eye, FileText, User, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";
import { getUserReportsApi } from "../../api/userApi";

const PAGE_SIZE = 5;

export default function UserReportDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadEmployeeReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getUserReportsApi(userId);

      setEmployee(res.user || null);
      setReports(res.reports || []);
      setTotalMinutes(res.total_minutes || 0);
      setCurrentPage(1);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to load employee reports";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEmployeeReports();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadEmployeeReports]);

  const visibleReports = reports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <DashboardLayout title="EMPLOYEE REPORT DETAILS">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/users")}
              className="mt-1 rounded-xl border p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {employee?.full_name || "Employee Reports"}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Submitted work records for this employee
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl bg-blue-50 px-4 py-4 text-blue-700 sm:w-auto sm:min-w-[180px] sm:px-5">
            <Clock3 size={22} />
            <div>
              <p className="text-xs font-semibold uppercase">Total Hours</p>
              <p className="text-xl font-bold">{minutesToText(totalMinutes)}</p>
            </div>
          </div>
        </div>

        {loading && (
          <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            <Loader message="Loading employee reports..." className="py-0" />
          </section>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-100 bg-white p-12 text-center text-red-500 shadow-sm">
            {error}
          </section>
        )}

        {!loading && !error && employee && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Employee Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Draft reports are excluded from this summary
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <User />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard label="Employee Name" value={employee.full_name} />
                <InfoCard label="Email" value={employee.email} />
                <InfoCard label="Role" value={employee.role} />
                <InfoCard
                  label="Status"
                  value={employee.is_active ? "Active" : "Inactive"}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4 sm:p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Submitted Daily Reports
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Total Reports : {reports.length}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FileText />
                </div>
              </div>

              <div className="space-y-3 bg-slate-50/60 p-4 md:hidden">
                {reports.length === 0 ? (
                  <EmptyState title="No submitted daily reports found for this employee." />
                ) : (
                  visibleReports.map((report, index) => (
                    <MobileCard key={report.worksheet_id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatDate(report.work_date)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {minutesToText(report.total_minutes)} total
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          #{(currentPage - 1) * PAGE_SIZE + index + 1}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <MobileField label="Entries" value={report.entries?.length || 0} />
                        <MobileField label="Submitted" value={formatDateTime(report.submitted_at)} />
                        <MobileField label="Sheet Status">
                          <Badge value={report.status} />
                        </MobileField>
                        <MobileField label="Review">
                          <Badge value={report.review_status} />
                        </MobileField>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report)}
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
                <Table>
                  <thead>
                    <tr className="border-b bg-slate-50 text-sm text-slate-700">
                      <th className="px-4 py-4">#</th>
                      <th className="px-4 py-4">Date</th>
                      <th className="px-4 py-4">Total Time</th>
                      <th className="px-4 py-4">Entries</th>
                      <th className="px-4 py-4">Sheet Status</th>
                      <th className="px-4 py-4">Review</th>
                      <th className="px-4 py-4">Submitted At</th>
                      <th className="px-4 py-4 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleReports.map((report, index) => (
                      <tr key={report.worksheet_id} className="border-b text-sm">
                        <td className="px-4 py-5 font-bold">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className="px-4 py-5">{formatDate(report.work_date)}</td>
                        <td className="px-4 py-5 font-semibold text-slate-800">
                          {minutesToText(report.total_minutes)}
                        </td>
                        <td className="px-4 py-5 text-slate-600">
                          {report.entries?.length || 0}
                        </td>
                        <td className="px-4 py-5">
                          <Badge value={report.status} />
                        </td>
                        <td className="px-4 py-5">
                          <Badge value={report.review_status} />
                        </td>
                        <td className="px-4 py-5">
                          {formatDateTime(report.submitted_at)}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="rounded-lg border p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {reports.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-14 text-center text-slate-500">
                          <EmptyState title="No submitted daily reports found for this employee." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <Pagination
                  currentPage={currentPage}
                  totalItems={reports.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            </section>
          </>
        )}
      </div>

      {selectedReport && (
        <Modal open={true} onClose={() => setSelectedReport(null)} panelClassName="p-4 sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Report Detail
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {employee?.full_name || "-"} - {formatDate(selectedReport.work_date)}
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg border p-2 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <InfoCard
                label="Total Time"
                value={minutesToText(selectedReport.total_minutes)}
              />
              <InfoCard label="Status" value={selectedReport.status} />
              <InfoCard label="Review" value={selectedReport.review_status} />
              <InfoCard
                label="Submitted"
                value={formatDateTime(selectedReport.submitted_at)}
              />
            </div>

            <div className="mt-6 space-y-3 md:hidden">
              {(selectedReport.entries || []).length === 0 ? (
                <EmptyState title="No entries found." />
              ) : (
                (selectedReport.entries || []).map((entry, index) => (
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
                      <MobileField label="Start" value={formatTime(entry.start_time)} />
                      <MobileField label="Stop" value={formatTime(entry.stop_time)} />
                      <MobileField label="Total" value={minutesToText(entry.total_minutes)} />
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
                    <th className="px-4 py-4">Title</th>
                    <th className="px-4 py-4">Start</th>
                    <th className="px-4 py-4">Stop</th>
                    <th className="px-4 py-4">Total</th>
                    <th className="px-4 py-4">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {(selectedReport.entries || []).map((entry, index) => (
                    <tr key={entry.id} className="border-t text-sm">
                      <td className="px-4 py-4 font-bold">{index + 1}</td>
                      <td className="px-4 py-4">{entry.project_name || "-"}</td>
                      <td className="px-4 py-4 font-semibold">
                        {entry.task_title || "-"}
                      </td>
                      <td className="px-4 py-4">{formatTime(entry.start_time)}</td>
                      <td className="px-4 py-4">{formatTime(entry.stop_time)}</td>
                      <td className="px-4 py-4">
                        {minutesToText(entry.total_minutes)}
                      </td>
                      <td className="max-w-[280px] px-4 py-4 text-slate-600">
                        {entry.description || "-"}
                      </td>
                    </tr>
                  ))}

                  {(selectedReport.entries || []).length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-500">
                        <EmptyState title="No entries found." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
        </Modal>
      )}
    </DashboardLayout>
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

function MobileField({ label, value, children }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      {children || <p className="text-slate-700">{value}</p>}
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
