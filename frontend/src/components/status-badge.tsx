type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "warning" | "success" | "info";
};

function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : tone === "info"
      ? "bg-sky-100 text-sky-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass}`}
    >
      {label}
    </span>
  );
}

export { StatusBadge };
