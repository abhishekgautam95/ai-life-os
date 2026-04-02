type StatCardProps = {
  label: string;
  value: string | number;
  helper: string;
  tone?: "default" | "accent" | "soft";
};

function StatCard({
  label,
  value,
  helper,
  tone = "default",
}: StatCardProps) {
  const toneClass =
    tone === "accent"
      ? "border-transparent bg-[linear-gradient(135deg,rgba(20,33,61,1),rgba(33,58,108,0.94))] text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      : tone === "soft"
      ? "bg-[color:var(--panel)]"
      : "bg-white/88";

  const helperClass =
    tone === "accent" ? "text-white/72" : "text-[color:var(--muted)]";

  return (
    <div
      className={`rounded-[28px] border border-[color:var(--border)] px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] ${toneClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">
        {label}
      </p>
      <p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className={`mt-3 text-sm leading-6 ${helperClass}`}>{helper}</p>
    </div>
  );
}

export { StatCard };
