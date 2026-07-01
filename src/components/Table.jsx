export default function Table({
  children,
  className = "",
  containerClassName = "",
  minWidth = "min-w-[1000px]",
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${containerClassName}`}>
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} text-left text-sm ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
}
