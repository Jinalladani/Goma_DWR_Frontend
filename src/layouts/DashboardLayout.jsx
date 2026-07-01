import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({ children, title }) {
  const user = JSON.parse(localStorage.getItem("goma_user"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f8fbff_32%,#f6f8fb_100%)] text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Header
        title={title}
        user={user}
        onMenuClick={() => setSidebarOpen((current) => !current)}
      />

      <main className="pt-[72px] lg:ml-[260px] lg:pt-[82px]">
        <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
