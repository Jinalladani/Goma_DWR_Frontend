import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-5xl",
  panelClassName = "",
  side = false,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-slate-950/45 backdrop-blur-sm ${
        side ? "justify-end" : "items-center justify-center p-0 sm:p-4"
      }`}
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className={`w-full overflow-y-auto bg-white shadow-2xl ${
          side
            ? "h-full max-w-md border-l border-slate-200"
            : `h-full max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[90vh] sm:rounded-3xl ${maxWidth}`
        } ${panelClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
