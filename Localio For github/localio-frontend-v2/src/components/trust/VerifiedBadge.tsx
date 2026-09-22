import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium"
      style={{ color: "var(--trust)" }}
      title="This reviewer was near this location when the review was posted."
    >
      <BadgeCheck size={14} strokeWidth={2} />
      {!compact && "Verified visit"}
    </span>
  );
}
