export default function MobileCard({ children, className = "" }) {
  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </article>
  );
}
