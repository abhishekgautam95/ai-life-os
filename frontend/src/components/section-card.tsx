type SectionCardProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "soft" | "strong";
  className?: string;
};

function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  tone = "default",
  className = "",
}: SectionCardProps) {
  const toneClass =
    tone === "soft"
      ? "bg-[color:var(--panel)]"
      : tone === "strong"
      ? "bg-[color:var(--panel-strong)]"
      : "bg-white/88";

  return (
    <section
      className={`rounded-[28px] border border-[color:var(--border)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-6 ${toneClass} ${className}`}
    >
      {(eyebrow || title || description || action) && (
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                {description}
              </p>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}

      {children}
    </section>
  );
}

export { SectionCard };
