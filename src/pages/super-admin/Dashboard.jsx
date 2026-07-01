import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCog,
  FolderKanban,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/StatCard";
import { superAdminDashboardApi } from "../../api/dashboardApi";

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const res = await superAdminDashboardApi();
      setData(res.data);
    } catch (error) {
      console.error("Dashboard load failed:", error);
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

  const worksheetStats = useMemo(() => {
    const total = data?.total_worksheets || 0;
    const submitted = data?.submitted_worksheets || 0;
    const approved = data?.approved_worksheets || 0;
    const rejected = data?.rejected_worksheets || 0;
    const pending = Math.max(submitted - approved - rejected, 0);

    return {
      total,
      submitted,
      approved,
      rejected,
      pending,
      approvedPercent: total ? Math.round((approved / total) * 100) : 0,
      rejectedPercent: total ? Math.round((rejected / total) * 100) : 0,
      pendingPercent: total ? Math.round((pending / total) * 100) : 0,
    };
  }, [data]);

  return (
    <DashboardLayout title="SUPER ADMIN DASHBOARD">
      <div className="space-y-4 sm:space-y-6">

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <StatCard
            title="Total Users"
            value={data?.total_users || 0}
            sub="All system users"
            icon={<Users size={24} />}
            color="blue"
            className="rounded-3xl transition hover:-translate-y-1 hover:shadow-md"
          />

          <StatCard
            title="Total Admins"
            value={data?.total_admins || 0}
            sub="Manager accounts"
            icon={<UserCog size={24} />}
            color="green"
            className="rounded-3xl transition hover:-translate-y-1 hover:shadow-md"
          />

          <StatCard
            title="Total Employees"
            value={data?.total_employees || 0}
            sub="Employee accounts"
            icon={<Users size={24} />}
            color="orange"
            className="rounded-3xl transition hover:-translate-y-1 hover:shadow-md"
          />

          <StatCard
            title="Total Projects"
            value={data?.total_projects || 0}
            sub="Company projects"
            icon={<FolderKanban size={24} />}
            color="purple"
            className="rounded-3xl transition hover:-translate-y-1 hover:shadow-md"
          />
        </div>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Worksheet Analytics
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Submitted, approved, rejected and pending worksheet summary
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BarChart3 />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total"
                value={worksheetStats.total}
                icon={<ClipboardList size={20} />}
                color="blue"
              />
              <SummaryCard
                label="Approved"
                value={worksheetStats.approved}
                icon={<CheckCircle size={20} />}
                color="green"
              />
              <SummaryCard
                label="Pending"
                value={worksheetStats.pending}
                icon={<Clock size={20} />}
                color="orange"
              />
              <SummaryCard
                label="Rejected"
                value={worksheetStats.rejected}
                icon={<XCircle size={20} />}
                color="red"
              />
            </div>

            <div className="mt-7 space-y-5">
              <ProgressRow
                label="Approved Worksheets"
                value={worksheetStats.approved}
                percent={worksheetStats.approvedPercent}
                bar="bg-green-500"
              />

              <ProgressRow
                label="Pending Worksheets"
                value={worksheetStats.pending}
                percent={worksheetStats.pendingPercent}
                bar="bg-orange-500"
              />

              <ProgressRow
                label="Rejected Worksheets"
                value={worksheetStats.rejected}
                percent={worksheetStats.rejectedPercent}
                bar="bg-red-500"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  System Health
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Quick system activity overview
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Activity />
              </div>
            </div>

            <div className="space-y-4">
              <HealthItem
                label="User Management"
                value={`${data?.total_users || 0} users active`}
                status="Running"
              />

              <HealthItem
                label="Project Module"
                value={`${data?.total_projects || 0} projects available`}
                status="Running"
              />

              <HealthItem
                label="Worksheet Module"
                value={`${worksheetStats.submitted} submitted reports`}
                status="Running"
              />

              <HealthItem
                label="Review Module"
                value={`${worksheetStats.approved} approved reports`}
                status="Running"
              />
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fast access to important admin modules
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              title="Manage Users"
              description="Create and manage admins/employees"
              icon={<Users size={24} />}
              color="blue"
              path="/users"
            />

            <QuickAction
              title="Manage Projects"
              description="Create and update project details"
              icon={<FolderKanban size={24} />}
              color="green"
              path="/projects"
            />

            <QuickAction
              title="Daily Reports"
              description="Review employee submitted reports"
              icon={<ClipboardList size={24} />}
              color="orange"
              path="/admin/reports"
            />

            {/* <QuickAction
              title="Settings"
              description="System configuration and controls"
              icon={<Settings size={24} />}
              color="slate"
              path="/settings"
            /> */}
          </div>
        </section>

        {loading && (
          <div className="fixed bottom-5 right-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
            Loading dashboard...
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ label, value, icon, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        {icon}
      </div>

      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}

function ProgressRow({ label, value, percent, bar }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">
          {value} ({percent}%)
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function HealthItem({ label, value, status }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{value}</p>
      </div>

      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
        {status}
      </span>
    </div>
  );
}

function QuickAction({ title, description, icon, color, path }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-100 text-slate-700",
  };

  const handleClick = () => {
    window.location.href = path;
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-3xl border border-slate-200 p-5 text-left transition hover:-translate-y-1 hover:bg-slate-50 hover:shadow-md"
    >
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${colorMap[color]}`}
      >
        {icon}
      </div>

      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </button>
  );
}
