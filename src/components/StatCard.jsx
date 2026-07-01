const iconColors = {
  blue: "from-blue-50 to-sky-50 text-blue-600 border-blue-100",
  green: "from-green-50 to-emerald-50 text-green-600 border-green-100",
  orange: "from-orange-50 to-amber-50 text-orange-600 border-orange-100",
  purple: "from-purple-50 to-violet-50 text-purple-600 border-purple-100",
  indigo: "from-indigo-50 to-blue-50 text-indigo-600 border-indigo-100",
  red: "from-red-50 to-rose-50 text-red-600 border-red-100",
};

const valueColors = {
  blue: "text-blue-700",
  green: "text-green-700",
  orange: "text-orange-700",
  purple: "text-purple-700",
  indigo: "text-indigo-700",
  red: "text-red-700",
};

export default function StatCard({
  title,
  value,
  sub,
  icon,
  color = "blue",
  className = "",
}) {
  return (
    <div
      className={`group overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
        iconColors[color] || iconColors.blue
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-600">{title}</p>
          <h3 className={`mt-3 truncate text-2xl font-extrabold sm:text-3xl ${valueColors[color] || valueColors.blue}`}>
            {value}
          </h3>
          {sub && <p className="mt-1 truncate text-sm font-medium text-slate-600">{sub}</p>}
        </div>

        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/75 shadow-sm ring-1 ring-white sm:h-14 sm:w-14">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
