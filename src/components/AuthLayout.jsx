import { ClipboardList, LineChart, Users, FolderKanban } from "lucide-react";

export default function AuthLayout({
  title = "Goma DWR",
  subtitle = "Daily Work Report System",
  heading = "Welcome Back",
  description = "Manage daily work reports, projects, employees and timesheets from one simple dashboard.",
  children,
}) {
  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-100">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[60%_40%]">
        <section className="relative hidden h-full overflow-hidden bg-[#f4f7fb] px-8 py-8 md:flex md:flex-col md:items-center md:justify-center xl:px-16">
          {/* <div className="absolute left-10 top-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057c2] to-[#38bdf8] text-white shadow-lg">
              <ClipboardList size={26} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Goma DWR</h2>
              <p className="text-xs font-medium text-slate-500">Daily Work Report</p>
            </div>
          </div> */}

          <div className="w-full max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 xl:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-lg font-medium text-slate-600">{subtitle}</p>
          </div>

          <div className="relative mt-8 h-[58vh] max-h-[560px] min-h-[420px] w-full max-w-4xl">
            <div className="absolute left-[10%] top-[6%] h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-[#2563eb]" />
            <div className="absolute right-[12%] top-[3%] h-40 w-40 rounded-full bg-[#0057c2]/10 blur-2xl" />
            <div className="absolute bottom-[8%] left-[6%] h-40 w-40 rounded-full bg-[#38bdf8]/20 blur-2xl" />

            <div className="absolute left-[18%] top-[6%] h-[52%] w-[58%] rounded-[28px] bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="mb-7 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-2 w-20 rounded-full bg-slate-200" />
                  <div className="h-2 w-12 rounded-full bg-slate-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-20 rounded-full bg-slate-200" />
                  <div className="h-2 w-12 rounded-full bg-slate-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-20 rounded-full bg-slate-200" />
                  <div className="h-2 w-12 rounded-full bg-slate-200" />
                </div>
              </div>

              <svg viewBox="0 0 420 150" className="h-36 w-full">
                <path d="M0 70 C55 15 105 125 160 70 S270 15 330 70 390 110 420 80" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
                <path d="M0 98 C70 38 120 100 180 80 S270 50 330 105 390 120 420 98" fill="none" stroke="#0057c2" strokeWidth="8" strokeLinecap="round" />
                <path d="M0 118 C55 80 110 118 165 95 S270 118 330 78 390 58 420 75" fill="none" stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" opacity="0.75" />
                <line x1="0" y1="10" x2="0" y2="142" stroke="#e2e8f0" strokeWidth="2" />
                <line x1="105" y1="10" x2="105" y2="142" stroke="#e2e8f0" strokeWidth="2" />
                <line x1="210" y1="10" x2="210" y2="142" stroke="#e2e8f0" strokeWidth="2" />
                <line x1="315" y1="10" x2="315" y2="142" stroke="#e2e8f0" strokeWidth="2" />
              </svg>
            </div>

            <div className="absolute bottom-[16%] left-[8%] h-[34%] w-[38%] rounded-[24px] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
              <div className="mb-4 flex gap-3">
                <div className="h-8 flex-1 rounded-lg bg-[#38bdf8]" />
                <div className="h-8 flex-1 rounded-lg bg-[#0057c2]" />
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-4">
                <div className="space-y-3">
                  <div className="h-3 rounded-full bg-slate-200" />
                  <div className="h-3 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-3 w-5/6 rounded-full bg-slate-200" />
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-[10px] border-[#38bdf8] border-r-[#0057c2]">
                  <LineChart size={22} className="text-[#0057c2]" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-[12%] right-[10%] w-[28%] rounded-[26px] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0057c2]">
                <FolderKanban size={30} />
              </div>
              <div className="space-y-3">
                <div className="h-3 rounded-full bg-slate-200" />
                <div className="h-3 w-3/4 rounded-full bg-slate-200" />
                <div className="h-3 w-1/2 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="absolute bottom-[2%] left-[43%] flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#0057c2] to-[#38bdf8] text-white shadow-xl">
              <Users size={46} />
            </div>
          </div>

          <p className="max-w-2xl text-center text-sm leading-6 text-slate-500">
            {description}
          </p>
        </section>

        <section className="flex h-full items-center justify-center overflow-hidden bg-[#172235] px-5 py-5 sm:px-8 lg:px-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 text-center sm:mb-8">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-xl sm:h-24 sm:w-24">
                <ClipboardList size={42} />
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{heading}</h2>
              <p className="mt-2 text-sm font-semibold text-blue-100 sm:text-base">
                {description}
              </p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
