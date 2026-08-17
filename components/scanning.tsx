/**
 * The one canonical empty state: an active system scanning for signal, not an
 * apology for missing data. Used everywhere a live surface has nothing to
 * show yet, so the site speaks one language instead of five "coming soon"s.
 */
export function Scanning({
  title = "Scanning for attention",
  line = "Live signals appear here as they are detected.",
  compact = false,
}: {
  title?: string;
  line?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "px-4 py-8" : "px-6 py-14"}`}
    >
      <span
        className={`radar ${compact ? "h-10 w-10" : "h-14 w-14"}`}
        aria-hidden="true"
      >
        <span className="radar-ring" />
        <span className="radar-dot" />
      </span>
      <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--text-soft)]">{line}</p>
    </div>
  );
}
