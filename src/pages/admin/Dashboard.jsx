import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ClipboardList,
  FolderKanban,
  Users,
  Clock,
  CheckCircle,
  CircleDot,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import MobileCard from "../../components/MobileCard";
import StatCard from "../../components/StatCard";
import Table from "../../components/Table";
import { adminDashboardApi } from "../../api/dashboardApi";
import { getAdminWorksheetsApi } from "../../api/adminWorksheetApi";
import { getProjectsApi } from "../../api/projectApi";
import { getUsersApi } from "../../api/userApi";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const today = getTodayDate();
 
      const [dashboardRes, reportsRes, projectsRes, employeesRes] =
        await Promise.all([
          adminDashboardApi(),
          getAdminWorksheetsApi({ work_date: today }),
          getProjectsApi(),
          getUsersApi({ role: "EMPLOYEE" }),
        ]);

      setData(dashboardRes.data);
      setReports(reportsRes.worksheets || []);
      setProjects(projectsRes.projects || []);
      setEmployees(employeesRes.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const totalMinutes = reports.reduce(
    (sum, item) => sum + (item.total_minutes || 0),
    0
  );
  const todayTotalMinutes = data?.today_total_minutes ?? totalMinutes;

  const statusData = {
    approved: reports.filter((item) => item.review_status === "APPROVED").length,
    pending: reports.filter((item) => item.review_status === "PENDING").length,
    rejected: reports.filter((item) => item.review_status === "REJECTED").length,
  };

  return (
    <DashboardLayout title="ADMIN DASHBOARD">
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <StatCard
            title="Total Employees"
            value={data?.total_employees || employees.length}
            sub="Active Employees"
            icon={<Users size={24} />}
            color="blue"
          />

          <StatCard
            title="Today's Reports"
            value={data?.today_submissions || 0}
            sub="Reports Submitted"
            icon={<ClipboardList size={24} />}
            color="green"
          />

          <StatCard
            title="Total Working Hours"
            value={minutesToText(todayTotalMinutes)}
            sub="Today Submitted Hours"
            icon={<Clock size={24} />}
            color="orange"
          />

          <StatCard
            title="Active Projects"
            value={data?.active_projects || projects.filter((p) => p.is_active).length}
            sub="Running Projects"
            icon={<FolderKanban size={24} />}
            color="indigo"
          />
        </div>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Reports By Project
            </h2>
            <p className="mt-1 text-sm text-slate-500">Today submitted report hours</p>

            <div className="mt-6 space-y-4">
              {getProjectStats(reports).map((item) => (
                <div key={item.project}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {item.project}
                    </span>
                    <span className="text-slate-500">
                      {minutesToText(item.minutes)}
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-blue-600"
                      style={{
                        width: `${totalMinutes ? (item.minutes / totalMinutes) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {!loading && getProjectStats(reports).length === 0 && (
                <EmptyState title="No project report data found." />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Status Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">Review summary</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatusBox
                label="Approved"
                value={statusData.approved}
                icon={<CheckCircle />}
                color="green"
              />
              <StatusBox
                label="Pending"
                value={statusData.pending}
                icon={<CircleDot />}
                color="orange"
              />
              <StatusBox
                label="Rejected"
                value={statusData.rejected}
                icon={<CircleDot />}
                color="red"
              />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Reports
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Today submitted employee reports
              </p>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {!loading && reports.length === 0 ? (
              <EmptyState title="No recent reports found." />
            ) : (
              reports.slice(0, 8).map((item, index) => (
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
                    <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <DashboardField label="Total Hours" value={minutesToText(item.total_minutes)} />
                    <DashboardField label="Submitted" value={formatDateTime(item.submitted_at)} />
                    <DashboardField label="Status">
                      <Badge value={item.status} />
                    </DashboardField>
                    <DashboardField label="Review">
                      <Badge value={item.review_status} />
                    </DashboardField>
                  </div>
                </MobileCard>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <Table containerClassName="rounded-xl border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-sm text-slate-700">
                  <th className="px-4 py-4">#</th>
                  <th className="px-4 py-4">Employee</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Total Hours</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Review</th>
                  <th className="px-4 py-4">Submitted At</th>
                </tr>
              </thead>

              <tbody>
                {reports.slice(0, 8).map((item, index) => (
                  <tr key={item.id} className="border-t text-sm">
                    <td className="px-4 py-5 font-bold">{index + 1}</td>
                    <td className="px-4 py-5 font-semibold">
                      {item.employee_name || "-"}
                    </td>
                    <td className="px-4 py-5">{formatDate(item.work_date)}</td>
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
                  </tr>
                ))}

                {!loading && reports.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <EmptyState title="No recent reports found." />
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function StatusBox({ label, value, icon, color }) {
  const colorMap = {
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
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

function getProjectStats(reports) {
  const map = {};

  reports.forEach((report) => {
    const projectName = report.project_name || "Submitted Reports";
    map[projectName] = (map[projectName] || 0) + (report.total_minutes || 0);
  });

  return Object.entries(map).map(([project, minutes]) => ({
    project,
    minutes,
  }));
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

function DashboardField({ label, value, children }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      {children || <p className="text-slate-700">{value}</p>}
    </div>
  );
}

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
