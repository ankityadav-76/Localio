import { ShieldCheck, BadgeCheck } from "lucide-react";
import type { Listing } from "../../types";

const TIER_CONFIG: Record<
  Listing["verification_tier"],
  { label: string; icon: typeof ShieldCheck | null; color: string } | null
> = {
  unverified: null,
  photo_verified: { label: "Photo verified", icon: BadgeCheck, color: "var(--trust)" },
  registered_business: { label: "Registered business", icon: ShieldCheck, color: "var(--trust)" },
};

export function VerificationTierBadge({ tier }: { tier: Listing["verification_tier"] }) {
  const config = TIER_CONFIG[tier];
  if (!config) return null;
  const Icon = config.icon!;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: config.color }}>
      <Icon size={13} strokeWidth={2} />
      {config.label}
    </span>
  );
}
