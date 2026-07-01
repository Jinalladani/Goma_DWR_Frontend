import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, FileSpreadsheet, FileText } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";
import WorksheetReviewModal from "../../components/WorksheetReviewModal";
import {
  getAdminWorksheetDetailApi,
  getAdminWorksheetsApi,
} from "../../api/adminWorksheetApi";
import { exportMultiSheetExcel } from "../../utils/exportExcel";

const PAGE_SIZE = 5;

export default function DailyReports() {
  const [worksheets, setWorksheets] = useState([]);
  const [selectedWorksheetId, setSelectedWorksheetId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [workDate, setWorkDate] = useState(getTodayDate());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
      };

      if (reviewStatus) params.review_status = reviewStatus;
      if (workDate) params.work_date = workDate;

      const res = await getAdminWorksheetsApi(params);

      setWorksheets(res.worksheets || []);
      setTotalItems(res.pagination?.total_items || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [currentPage, reviewStatus, workDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExportExcel = async () => {
    if (worksheets.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      setExporting(true);

      const summaryRows = worksheets.map((item, index) => ({
        "#": (currentPage - 1) * PAGE_SIZE + index + 1,
        Employee: item.employee_name || "-",
        Role:
          item.employee_role === "ADMIN"
            ? "MANAGER"
            : item.employee_role || "-",
        "Work Date": formatDate(item.work_date),
        "Total Time": minutesToText(item.total_minutes),
        "Sheet Status": item.status || "-",
        "Review Status": item.review_status || "-",
        "Submitted At": formatDateTime(item.submitted_at),
        Note: item.note || "-",
      }));

      const detailResponses = await Promise.all(
        worksheets.map((item) => getAdminWorksheetDetailApi(item.id))
      );

      const workEntryRows = [];
      const workerEntryRows = [];

      detailResponses.forEach((res) => {
        const worksheet = res.worksheet;

        (res.entries || []).forEach((entry, index) => {
          workEntryRows.push({
            "#": index + 1,
            Employee: worksheet?.employee_name || "-",
            Role:
              worksheet?.employee_role === "ADMIN"
                ? "MANAGER"
                : worksheet?.employee_role || "-",
            "Work Date": formatDate(worksheet?.work_date),
            Project: entry.project_name || "-",
            "Task Title": entry.task_title || "-",
            Description: entry.description || "-",
            "Start Time": formatTime(entry.start_time),
            "Stop Time": formatTime(entry.stop_time),
            "Total Time": minutesToText(entry.total_minutes),
            Status: entry.status || "-",
            "Review Status": worksheet?.review_status || "-",
          });
        });

        (res.worker_entries || []).forEach((entry, index) => {
          workerEntryRows.push({
            "#": index + 1,
            Employee: worksheet?.employee_name || "-",
            Worker: entry.worker_name || "-",
            "Worker Type": entry.worker_type || entry.work_type || "-",
            "Work Date": formatDate(entry.work_date || worksheet?.work_date),
            Project: entry.project_name || "-",
            "Task Title": entry.task_title || "-",
            Description: entry.description || "-",
            "Start Time": formatTime(entry.start_time),
            "End Time": formatTime(entry.end_time),
            "Total Time": minutesToText(entry.total_minutes),
            Status: entry.status || "-",
          });
        });
      });

      const exported = exportMultiSheetExcel({
        fileName: `daily_reports_${workDate || "all"}`,
        sheets: [
          {
            sheetName: "Daily Reports",
            rows: summaryRows,
          },
          {
            sheetName: "Work Entries",
            rows: workEntryRows,
          },
          {
            sheetName: "Worker Entries",
            rows: workerEntryRows,
          },
        ],
      });

      if (!exported) {
        toast.error("No data available to export");
        return;
      }

      toast.success("Excel exported successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Excel export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="DAILY REPORTS">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <PageHeader
          title="Employee Daily Reports"
          description="Review submitted worksheets and approve or reject reports"
          className="mb-6"
          // icon={<FileText />}
          actions={
            <>
              <input
                type="date"
                value={workDate}
                onChange={(event) => {
                  setWorkDate(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-blue-500 sm:w-auto"
              />

              <select
                value={reviewStatus}
                onChange={(event) => {
                  setReviewStatus(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-blue-500 sm:w-auto"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={loading || exporting || worksheets.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60 sm:w-auto"
              >
                <FileSpreadsheet size={18} />
                {exporting ? "Exporting..." : "Export Excel"}
              </button>
            </>
          }
        />

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
                      {item.employee_name || "-"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(item.work_date)}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    #{(currentPage - 1) * PAGE_SIZE + index + 1}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MobileField
                    label="Total Time"
                    value={minutesToText(item.total_minutes)}
                  />

                  <MobileField label="Role">
                    <RoleBadge value={item.employee_role} />
                  </MobileField>

                  <MobileField
                    label="Submitted"
                    value={formatDateTime(item.submitted_at)}
                  />

                  <MobileField label="Sheet Status">
                    <Badge value={item.status} />
                  </MobileField>

                  <MobileField label="Review">
                    <Badge value={item.review_status} />
                  </MobileField>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWorksheetId(item.id)}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  <Eye size={17} />
                  View Report
                </button>
              </MobileCard>
            ))
          )}
        </div>

        <div className="hidden md:block">
          <Table>
            <thead>
              <tr className="border-y bg-slate-50 text-sm text-slate-700">
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">Employee</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Work Date</th>
                <th className="px-4 py-4">Total Time</th>
                <th className="px-4 py-4">Sheet Status</th>
                <th className="px-4 py-4">Review</th>
                <th className="px-4 py-4">Submitted At</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {worksheets.map((item, index) => (
                <tr key={item.id} className="border-b text-sm">
                  <td className="px-4 py-5 font-bold">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </td>

                  <td className="px-4 py-5 font-semibold">
                    {item.employee_name || "-"}
                  </td>

                  <td className="px-4 py-5">
                    <RoleBadge value={item.employee_role} />
                  </td>

                  <td className="px-4 py-5">{formatDate(item.work_date)}</td>

                  <td className="px-4 py-5">
                    {minutesToText(item.total_minutes)}
                  </td>

                  <td className="px-4 py-5">
                    <Badge value={item.status} />
                  </td>

                  <td className="px-4 py-5">
                    <Badge value={item.review_status} />
                  </td>

                  <td className="px-4 py-5">
                    {formatDateTime(item.submitted_at)}
                  </td>

                  <td className="px-4 py-5">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setSelectedWorksheetId(item.id)}
                        className="rounded-lg border p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && worksheets.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <EmptyState title="No reports found." />
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
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
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </section>

      {selectedWorksheetId && (
        <WorksheetReviewModal
          open={true}
          worksheetId={selectedWorksheetId}
          onClose={() => setSelectedWorksheetId(null)}
          onReviewed={loadReports}
        />
      )}
    </DashboardLayout>
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

function RoleBadge({ value }) {
  const label = value === "ADMIN" ? "MANAGER" : value || "-";

  const color =
    value === "ADMIN"
      ? "bg-purple-50 text-purple-700"
      : value === "SUPER_ADMIN"
      ? "bg-slate-100 text-slate-700"
      : "bg-blue-50 text-blue-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

function MobileField({ label, value, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>

      {children || <p className="text-slate-700">{value}</p>}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  const day = date.getDate();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${day} ${months[date.getMonth()]}, ${date.getFullYear()}`;
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

  return `${formatDate(value)} ${formatTime(value)}`;
}

function minutesToText(minutes) {
  const total = minutes || 0;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;

  return `${String(hours).padStart(2, "0")}h ${String(remainder).padStart(
    2,
    "0"
  )}m`;
}

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}