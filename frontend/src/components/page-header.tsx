type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string[];
  action?: React.ReactNode;
};

function PageHeader({
  eyebrow,
  title,
  description,
  meta = [],
  action,
}: PageHeaderProps) {
  return (
    <section className="rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,253,248,0.98),rgba(255,249,240,0.9))] px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10 lg:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            {description}
          </p>
          {meta.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {meta.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[color:var(--border)] bg-white/75 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

export { PageHeader };
