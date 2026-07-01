export default function Loader({ message = "Loading...", className = "" }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 py-10 text-slate-500 ${className}`}
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      <span>{message}</span>
    </div>
  );
}
