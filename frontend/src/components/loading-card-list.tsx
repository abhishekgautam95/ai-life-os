type LoadingCardListProps = {
  count?: number;
  lines?: number;
};

function LoadingCardList({
  count = 3,
  lines = 3,
}: LoadingCardListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-5"
        >
          <div className="h-5 w-40 rounded-full bg-slate-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: lines }).map((__, lineIndex) => (
              <div
                key={lineIndex}
                className={`h-3 rounded-full bg-slate-100 ${
                  lineIndex === lines - 1 ? "w-2/3" : "w-full"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { LoadingCardList };
