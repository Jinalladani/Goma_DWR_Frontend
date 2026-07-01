export default function PageHeader({
  title,
  description,
  icon,
  actions,
  className = "",
  iconClassName = "bg-blue-50 text-blue-600",
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5 ${className}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {icon && (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-slate-950 sm:text-xl">{title}</h2>
            {description && (
              <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
