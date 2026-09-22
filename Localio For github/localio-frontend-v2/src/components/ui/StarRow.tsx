import { Star } from "lucide-react";

export function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          fill={n <= Math.round(value) ? "var(--star)" : "none"}
          color="var(--star)"
        />
      ))}
    </div>
  );
}
