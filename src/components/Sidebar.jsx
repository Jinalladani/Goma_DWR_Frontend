import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  FileText,
  Hammer,
  Clock,
  Users,
  Link2,
  LogOut,
  User,
  Headphones,
} from "lucide-react";

import { logoutApi } from "../api/authApi";
import { clearAuth, getRefreshToken, getUser } from "../utils/auth";

export default function Sidebar({ open = false, onClose }) {
  const user = getUser();

  const handleLogout = async () => {
    try {
      await logoutApi(getRefreshToken());
    } catch {
      // ignore logout API error
    }

    clearAuth();
    window.location.href = "/";
  };

  const menus = getMenus(user?.role);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col overflow-hidden bg-[#061d35] text-white shadow-2xl transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(24,119,242,0.5),transparent_34%),linear-gradient(180deg,#082b50_0%,#041a31_60%,#031525_100%)]" />

        <div className="relative flex items-center gap-3 px-6 py-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-950/30 ring-1 ring-white/20">
            <ClipboardList size={28} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Goma DWR</h1>
            <p className="text-xs font-medium text-blue-100">Daily Work Report</p>
          </div>
        </div>

        <div className="relative mx-6 h-px bg-white/10" />

        <nav className="relative mt-5 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-extrabold text-slate-900">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* <div className="relative mx-4 mb-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
          <h3 className="font-semibold">Need Help?</h3>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            If you need any assistance we are here to help you.
          </p>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/40 py-2 text-sm font-semibold hover:bg-white/10">
            <Headphones size={16} />
            Contact Support
          </button>
        </div> */}

        <div className="relative border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-red-500 hover:text-white"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function getMenus(role) {
  if (role === "SUPER_ADMIN") {
    return [
      { name: "Dashboard", path: "/super-admin/dashboard", icon: <LayoutDashboard size={20} /> },
      { name: "Projects", path: "/projects", icon: <FolderKanban size={20} /> },
      { name: "Users", path: "/users", icon: <Users size={20} /> },
      { name: "Project Access", path: "/project-access", icon: <Link2 size={20} /> },
      { name: "Workers", path: "/workers", icon: <Hammer size={20} />},
      { name: "Daily Reports", path: "/admin/reports", icon: <FileText size={20} /> },
      { name: "Profile", path: "/profile", icon: <User size={20} /> },
    ];
  }

  if (role === "ADMIN") {
    return [
      { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
      { name: "My Timesheet", path: "/admin/my-timesheet", icon: <Clock size={20} /> },
      { name: "Projects", path: "/projects", icon: <FolderKanban size={20} /> },
      { name: "Employees", path: "/users", icon: <Users size={20} /> },
      { name: "Workers", path: "/workers", icon: <Hammer size={20} /> },
      { name: "Project Access", path: "/project-access", icon: <Link2 size={20} /> },
      { name: "Daily Reports", path: "/admin/reports", icon: <FileText size={20} /> },
      { name: "Profile", path: "/profile", icon: <User size={20} /> },
    ];
  }

  return [
    { name: "Dashboard", path: "/employee/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "My Reports", path: "/employee/reports", icon: <ClipboardList size={20} /> },
    { name: "Workers", path: "/workers", icon: <Hammer size={20} />},
    { name: "Profile", path: "/profile", icon: <User size={20} /> },
  ];
}
