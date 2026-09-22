import { Link } from "react-router-dom";
import type { Listing } from "../../types";
import { StarRow } from "../ui/StarRow";
import { VerificationTierBadge } from "../trust/VerificationTierBadge";

const CATEGORY_LABEL: Record<Listing["category"], string> = {
  street_food: "Street food",
  eatery: "Eatery",
};

export function PlaceCard({ listing, fill = false }: { listing: Listing; fill?: boolean }) {
  return (
    <Link
      to={`/place/${listing.id}`}
      className={`card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow ${
        fill ? "w-full" : "shrink-0 w-64"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="pill w-fit">{CATEGORY_LABEL[listing.category]}</span>
        <VerificationTierBadge tier={listing.verification_tier} />
      </div>
      <p className="font-display font-medium text-base leading-snug">{listing.name}</p>
      {listing.landmark && (
        <p className="text-xs text-ink-soft -mt-1">Near {listing.landmark}</p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <StarRow value={listing.bayesian_avg} size={13} />
        <span className="text-xs text-ink-soft">
          {listing.review_count > 0 ? `${listing.bayesian_avg.toFixed(1)} · ${listing.review_count} reviews` : "New"}
        </span>
      </div>
    </Link>
  );
}
