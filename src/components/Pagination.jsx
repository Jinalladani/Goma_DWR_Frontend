import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3  pt-4 sm:flex-row">
      <p className="text-sm text-slate-500">
        Page <b>{currentPage}</b> of <b>{totalPages}</b>
      </p>

      <div className="flex max-w-full items-center gap-1 overflow-x-auto sm:gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {visiblePages.map((page, index) =>
          page === "..." ? (
            <span key={`${page}-${index}`} className="px-1 text-slate-400">
              ...
            </span>
          ) : (
            <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold sm:px-4 ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {page}
          </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("...");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("...");

  pages.push(totalPages);
  return pages;
}
