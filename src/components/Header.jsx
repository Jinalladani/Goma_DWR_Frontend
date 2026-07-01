import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronDown, LogOut, Menu, User } from "lucide-react";

import { logoutApi } from "../api/authApi";
import { clearAuth, getRefreshToken } from "../utils/auth";

export default function Header({ title, user, onMenuClick }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const date = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;

  const userName = user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const roleLabel = formatRole(user?.role);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
    try {
      await logoutApi(getRefreshToken());
    } catch {
      // ignore logout API error and continue local logout
    }

    clearAuth();
    window.location.href = "/";
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 lg:left-[260px] lg:h-[76px] lg:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={24} />
        </button>

        <h1 className="truncate text-base font-bold tracking-wide text-slate-900 sm:text-xl lg:text-2xl">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">
        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 px-5 py-3 md:flex">
          <CalendarDays size={20} />
          <span className="text-sm font-medium text-slate-700">{today}</span>
        </div>

        <div ref={dropdownRef} className="relative border-l border-slate-200 pl-2 sm:pl-4 lg:pl-6">
          <button
            type="button"
            onClick={() => setDropdownOpen((current) => !current)}
            className="flex items-center gap-2 rounded-full p-1 transition hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm sm:h-11 sm:w-11">
              {userInitial}
            </span>
            <ChevronDown
              size={18}
              className={`hidden text-slate-500 transition sm:block ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="menu">
              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{userName}</p>
                    <p className="text-xs font-medium text-slate-500">{roleLabel}</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  role="menuitem"
                >
                  <User size={18} />
                  Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  role="menuitem"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function formatRole(role) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "ADMIN") return "Admin / Manager";
  if (role === "EMPLOYEE") return "Employee";
  return role || "Employee";
}
