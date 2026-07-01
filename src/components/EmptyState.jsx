export default function EmptyState({
  title = "No records found.",
  description,
  icon,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center text-slate-500 ${className}`}
    >
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="font-bold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-sm font-medium">{description}</p>}
    </div>
  );
}
