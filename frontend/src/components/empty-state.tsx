type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  tip?: string;
};

function EmptyState({ eyebrow, title, description, tip }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] px-5 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
        {eyebrow}
      </p>
      <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[color:var(--foreground)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
        {description}
      </p>
      {tip ? (
        <p className="mt-3 text-sm font-medium leading-6 text-[color:var(--foreground)]">
          {tip}
        </p>
      ) : null}
    </div>
  );
}

export { EmptyState };
