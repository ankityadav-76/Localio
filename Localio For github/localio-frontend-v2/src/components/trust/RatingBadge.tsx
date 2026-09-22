import { StarRow } from "../ui/StarRow";

export function RatingBadge({
  value,
  reviewCount,
  size = "md",
}: {
  value: number;
  reviewCount: number;
  size?: "md" | "lg";
}) {
  const isEarly = reviewCount > 0 && reviewCount < 5;
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-display font-semibold leading-none ${size === "lg" ? "text-5xl" : "text-2xl"}`}
        >
          {reviewCount > 0 ? value.toFixed(1) : "—"}
        </span>
        <StarRow value={value} size={size === "lg" ? 18 : 14} />
      </div>
      <p className="text-sm text-ink-soft mt-1.5">
        {reviewCount === 0
          ? "No reviews yet"
          : isEarly
            ? `Early rating · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
            : `${reviewCount} reviews`}
      </p>
    </div>
  );
}
