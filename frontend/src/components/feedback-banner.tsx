type FeedbackBannerProps = {
  tone?: "success" | "error" | "info";
  message: string;
};

function FeedbackBanner({
  tone = "info",
  message,
}: FeedbackBannerProps) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <div
      className={`rounded-[22px] border px-5 py-4 text-sm font-medium shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${toneClass}`}
    >
      {message}
    </div>
  );
}

export { FeedbackBanner };
