import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock3,
  Eye,
  FileSpreadsheet,
  FolderKanban,
  Users,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import MobileCard from "../../components/MobileCard";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Table from "../../components/Table";
import {
  getProjectEmployeeReportApi,
  getProjectReportApi,
} from "../../api/projectApi";
import { exportMultiSheetExcel } from "../../utils/exportExcel";

const PAGE_SIZE = 5;

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [employeeTotalMinutes, setEmployeeTotalMinutes] = useState(0);
  const [workerTotalMinutes, setWorkerTotalMinutes] = useState(0);
  const [submittedTotalMinutes, setSubmittedTotalMinutes] = useState(0);
  const [approvedTotalMinutes, setApprovedTotalMinutes] = useState(0);
  const [rejectedTotalMinutes, setRejectedTotalMinutes] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [employeeDetail, setEmployeeDetail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadProjectReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getProjectReportApi(projectId, {
        page: currentPage,
        limit: PAGE_SIZE,
      });

      setProject(res.project || null);
      setEmployees(res.employees || []);
      setTotalMinutes(res.total_minutes || 0);
      setEmployeeTotalMinutes(res.normal_total_minutes || 0);
      setWorkerTotalMinutes(res.worker_total_minutes || 0);
      setSubmittedTotalMinutes(res.submitted_total_minutes || 0);
      setApprovedTotalMinutes(res.approved_total_minutes || 0);
      setRejectedTotalMinutes(res.rejected_total_minutes || 0);
      setTotalItems(res.pagination?.total_items || 0);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to load project details";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, projectId]);

  useEffect(() => {
    loadProjectReport();
  }, [loadProjectReport]);

  const handleViewEmployee = async (employee) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setEmployeeDetail(null);

      const res = await getProjectEmployeeReportApi(
        projectId,
        employee.employee_id
      );

      setEmployeeDetail(res);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load employee work detail"
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (employees.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      setExporting(true);

      const summaryRows = employees.map((employee, index) => ({
        "#": (currentPage - 1) * PAGE_SIZE + index + 1,
        "Project Name": project?.project_name || "-",
        "Project Code": project?.project_code || "-",
        Employee: employee.name || "-",
        Email: employee.email || "-",
        "Own Work Hours": minutesToText(employee.own_work_minutes),
        "Worker Work Hours": minutesToText(employee.worker_work_minutes),
        "Total Hours": minutesToText(employee.total_minutes),
        "Own Entries": employee.entry_count || 0,
        "Worker Entries": employee.worker_entry_count || 0,
        "Total Entries":
          (employee.entry_count || 0) + (employee.worker_entry_count || 0),
      }));

      const detailResponses = await Promise.all(
        employees.map((employee) =>
          getProjectEmployeeReportApi(projectId, employee.employee_id)
        )
      );

      const workEntryRows = [];
      const workerEntryRows = [];

      detailResponses.forEach((res) => {
        const employee = res.employee;

        (res.entries || []).forEach((entry, index) => {
          workEntryRows.push({
            "#": index + 1,
            "Project Name": project?.project_name || "-",
            Employee: employee?.name || "-",
            Email: employee?.email || "-",
            Date: entry.work_date || "-",
            Task: entry.task_title || "-",
            Description: entry.description || "-",
            "Start Time": formatTime(entry.start_time),
            "Stop Time": formatTime(entry.stop_time),
            "Total Time": minutesToText(entry.total_minutes),
            "Review Status": entry.review_status || "-",
          });
        });

        (res.worker_entries || []).forEach((entry, index) => {
          workerEntryRows.push({
            "#": index + 1,
            "Project Name": project?.project_name || "-",
            Employee: employee?.name || "-",
            Email: employee?.email || "-",
            Worker: entry.worker_name || "-",
            Date: entry.work_date || "-",
            "Work Type": entry.work_type || "-",
            Task: entry.task_title || "-",
            Description: entry.description || "-",
            "Start Time": formatTime(entry.start_time),
            "End Time": formatTime(entry.end_time),
            "Total Time": minutesToText(entry.total_minutes),
            "Review Status": entry.review_status || "-",
          });
        });
      });

      const exported = exportMultiSheetExcel({
        fileName: `project_${project?.project_name || projectId}_report`,
        sheets: [
          { sheetName: "Employee Summary", rows: summaryRows },
          { sheetName: "Work Entries", rows: workEntryRows },
          { sheetName: "Worker Entries", rows: workerEntryRows },
        ],
      });

      if (!exported) {
        toast.error("No data available to export");
        return;
      }

      toast.success("Excel exported successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Excel export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="PROJECT DETAILS">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/projects")}
              className="mt-1 rounded-xl border p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {project?.project_name || "Project Details"}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {project?.project_code
                  ? `${project.project_code} - Submitted work summary by employee`
                  : "Submitted work summary by employee"}
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
            <Loader message="Loading project details..." className="py-0" />
          </section>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-100 bg-white p-12 text-center text-red-500 shadow-sm">
            {error}
          </section>
        )}

        {!loading && !error && project && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Project Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Hours are calculated from submitted worksheets only
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FolderKanban />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <InfoCard
                  label="Total Employee Hours"
                  value={minutesToText(employeeTotalMinutes)}
                />
                <InfoCard
                  label="Total Worker Hours"
                  value={minutesToText(workerTotalMinutes)}
                />
                <InfoCard
                  label="Total Submitted Hours"
                  value={minutesToText(submittedTotalMinutes)}
                />
                <InfoCard
                  label="Total Approved Hours"
                  value={minutesToText(approvedTotalMinutes)}
                />
                <InfoCard
                  label="Total Rejected Hours"
                  value={minutesToText(rejectedTotalMinutes)}
                />
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Description
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {project.description || "-"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Employee Work Summary
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Employees with submitted work on this project
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={exporting || employees.length === 0}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                  >
                    <FileSpreadsheet size={18} />
                    {exporting ? "Exporting..." : "Export Excel"}
                  </button>

                  {/* <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Users />
                  </div> */}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50/60 p-4 md:hidden">
                {employees.length === 0 ? (
                  <EmptyState title="No submitted work found for this project." />
                ) : (
                  employees.map((employee, index) => (
                    <MobileCard key={employee.employee_id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {employee.name || "-"}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {employee.email || "-"}
                          </p>
                        </div>

                        <span className="text-xs font-bold text-slate-400">
                          #{(currentPage - 1) * PAGE_SIZE + index + 1}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                        <MobileMetric
                          label="Own"
                          value={minutesToText(employee.own_work_minutes)}
                        />
                        <MobileMetric
                          label="Worker"
                          value={minutesToText(employee.worker_work_minutes)}
                        />
                        <MobileMetric
                          label="Total"
                          value={minutesToText(employee.total_minutes)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewEmployee(employee)}
                        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={17} />
                        View
                      </button>
                    </MobileCard>
                  ))
                )}
              </div>

              <div className="hidden md:block">
                <Table minWidth="min-w-[850px]">
                  <thead>
                    <tr className="border-b bg-slate-50 text-sm text-slate-700">
                      <th className="px-4 py-4">#</th>
                      <th className="px-4 py-4">Employee</th>
                      <th className="px-4 py-4">Email</th>
                      <th className="px-4 py-4">Own Work Hours</th>
                      <th className="px-4 py-4">Worker Work Hours</th>
                      <th className="px-4 py-4">Total Hours</th>
                      <th className="px-4 py-4">Entries</th>
                      <th className="px-4 py-4 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((employee, index) => (
                      <tr
                        key={employee.employee_id}
                        className="border-b text-sm"
                      >
                        <td className="px-4 py-5 font-bold">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>

                        <td className="px-4 py-5 font-semibold text-slate-800">
                          {employee.name || "-"}
                        </td>

                        <td className="px-4 py-5 text-slate-600">
                          {employee.email || "-"}
                        </td>

                        <td className="px-4 py-5 font-semibold text-slate-800">
                          {minutesToText(employee.own_work_minutes)}
                        </td>

                        <td className="px-4 py-5 font-semibold text-slate-800">
                          {minutesToText(employee.worker_work_minutes)}
                        </td>

                        <td className="px-4 py-5 font-semibold text-slate-800">
                          {minutesToText(employee.total_minutes)}
                        </td>

                        <td className="px-4 py-5 text-slate-600">
                          {(employee.entry_count || 0) +
                            (employee.worker_entry_count || 0)}
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleViewEmployee(employee)}
                              className="rounded-xl border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {employees.length === 0 && (
                      <tr>
                        <td
                          colSpan="8"
                          className="py-14 text-center text-slate-500"
                        >
                          <EmptyState title="No submitted work found for this project." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            </section>
          </>
        )}
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)}>
        <div className="p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Employee Work Detail
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {employeeDetail?.employee?.name || "-"} -{" "}
                {project?.project_name || "-"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              <X size={18} />
            </button>
          </div>

          {detailLoading ? (
            <Loader message="Loading employee work detail..." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard
                  label="Own Work Total"
                  value={minutesToText(
                    employeeDetail?.summary?.own_work_minutes
                  )}
                />

                <InfoCard
                  label="Worker Work Total"
                  value={minutesToText(
                    employeeDetail?.summary?.worker_work_minutes
                  )}
                />

                <InfoCard
                  label="Total Entries"
                  value={employeeDetail?.summary?.entry_count || 0}
                />
              </div>

              <DetailSection
                title="Employee Work Entries"
                entries={employeeDetail?.entries || []}
                type="employee"
              />

              <DetailSection
                title="Worker Work Entries"
                entries={employeeDetail?.worker_entries || []}
                type="worker"
              />
            </>
          )}
        </div>
      </Modal>
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

function MobileMetric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function DetailSection({ title, entries, type }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-bold text-slate-900">{title}</h3>

        <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
          {minutesToText(sumMinutes(entries))}
        </span>
      </div>

      <div className="hidden md:block">
        <Table minWidth="min-w-[900px]" containerClassName="rounded-xl border">
          <thead>
            <tr className="bg-slate-50 text-sm text-slate-700">
              <th className="px-4 py-4">#</th>
              {type === "worker" && <th className="px-4 py-4">Worker</th>}
              <th className="px-4 py-4">Date</th>
              {type === "worker" && <th className="px-4 py-4">Work Type</th>}
              <th className="px-4 py-4">Task</th>
              <th className="px-4 py-4">Description</th>
              <th className="px-4 py-4">Start</th>
              <th className="px-4 py-4">{type === "worker" ? "End" : "Stop"}</th>
              <th className="px-4 py-4">Total</th>
              <th className="px-4 py-4">Review</th>
            </tr>
          </thead>

          <tbody>
            {entries.map((entry, index) => (
              <tr key={`${type}-${entry.id}`} className="border-t text-sm">
                <td className="px-4 py-4 font-bold">{index + 1}</td>

                {type === "worker" && (
                  <td className="px-4 py-4 font-semibold">
                    {entry.worker_name || "-"}
                  </td>
                )}

                <td className="px-4 py-4">{entry.work_date || "-"}</td>

                {type === "worker" && (
                  <td className="px-4 py-4">{entry.work_type || "-"}</td>
                )}

                <td className="px-4 py-4 font-semibold">
                  {entry.task_title || "-"}
                </td>

                <td className="px-4 py-4 max-w-[260px] text-slate-600">
                  {entry.description || "-"}
                </td>

                <td className="px-4 py-4">{formatTime(entry.start_time)}</td>

                <td className="px-4 py-4">
                  {formatTime(type === "worker" ? entry.end_time : entry.stop_time)}
                </td>

                <td className="px-4 py-4 font-semibold">
                  {minutesToText(entry.total_minutes)}
                </td>

                <td className="px-4 py-4">{entry.review_status || "-"}</td>
              </tr>
            ))}

            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={type === "worker" ? 10 : 8}
                  className="py-10 text-center text-slate-500"
                >
                  <EmptyState title="No entries found." />
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function minutesToText(minutes) {
  const total = minutes || 0;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

function sumMinutes(entries) {
  return entries.reduce((total, entry) => total + (entry.total_minutes || 0), 0);
}