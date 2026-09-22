import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, MessageSquareText } from "lucide-react";
import { getVendorDashboard } from "../lib/api";
import type { VendorDashboard } from "../types";
import { RatingBadge } from "../components/trust/RatingBadge";
import { VerificationTierBadge } from "../components/trust/VerificationTierBadge";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";

const CATEGORY_LABEL: Record<string, string> = {
  street_food: "Street food",
  eatery: "Eatery",
};

export default function VendorDashboardPage() {
  const { id } = useParams();
  const listingId = Number(id);
  const { userId } = useAuth();

  const [data, setData] = useState<VendorDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getVendorDashboard(listingId, userId)
      .then(setData)
      .catch(() => setError("Couldn't load this dashboard — is this listing yours?"));
  }, [listingId, userId]);

  if (!userId) {
    return (
      <div className="px-4 md:px-8 py-10 max-w-md">
        <p className="font-display font-semibold text-xl mb-2">Log in to see your dashboard</p>
        <Link to="/login" className="inline-flex items-center bg-accent text-accent-ink font-medium px-5 py-2.5 rounded-full text-sm">
          Log in
        </Link>
      </div>
    );
  }

  if (error) {
    return <div className="px-4 md:px-8 py-8 text-sm" style={{ color: "var(--star)" }}>{error}</div>;
  }

  if (!data) {
    return <div className="px-4 md:px-8 py-8 text-sm text-ink-soft">Loading...</div>;
  }

  const { listing, total_helpful_votes, recent_reviews } = data;

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <p className="text-xs text-ink-faint">Your business dashboard</p>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-display font-semibold text-2xl">{listing.name}</h1>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm text-ink-soft">
          {CATEGORY_LABEL[listing.category]}
          {listing.landmark ? ` · Near ${listing.landmark}` : ""}
        </p>
      </div>
      <VerificationTierBadge tier={listing.verification_tier} />

      <div className="grid grid-cols-2 gap-3 mt-6 mb-8">
        <div className="card p-4">
          <RatingBadge value={listing.bayesian_avg} reviewCount={listing.review_count} />
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <Heart size={20} strokeWidth={1.75} color="var(--star)" />
            <span className="font-display font-semibold text-2xl">{total_helpful_votes}</span>
          </div>
          <p className="text-sm text-ink-soft mt-1.5">Helpful votes across all reviews</p>
        </div>
      </div>

      {listing.description && (
        <div className="card p-4 mb-6">
          <p className="text-xs text-ink-soft mb-1">Your description</p>
          <p className="text-sm">{listing.description}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <MessageSquareText size={16} className="text-ink-soft" />
        <h2 className="font-display font-semibold text-lg">What customers are saying</h2>
      </div>
      <p className="text-xs text-ink-faint mb-4">
        This is a read-only view — there's no reply or edit option here by design, so reviews stay an
        honest signal for customers.
      </p>

      {recent_reviews.length === 0 ? (
        <EmptyState title="No reviews yet" subtitle="Once customers start reviewing, they'll show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {recent_reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
