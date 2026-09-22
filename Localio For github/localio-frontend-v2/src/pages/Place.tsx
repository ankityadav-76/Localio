import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PenLine, Navigation, MapPin } from "lucide-react";
import { getListing, getReviews, voteReviewHelpful } from "../lib/api";
import type { Listing, Review } from "../types";
import { RatingBadge } from "../components/trust/RatingBadge";
import { VerificationTierBadge } from "../components/trust/VerificationTierBadge";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "tag_taste", label: "Taste" },
  { key: "tag_value", label: "Value" },
  { key: "tag_hygiene", label: "Hygiene" },
  { key: "tag_crowd", label: "Crowd" },
] as const;

const SORTS = [
  { key: "helpful", label: "Most helpful" },
  { key: "newest", label: "Newest" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
  { key: "verified", label: "Verified" },
] as const;

const CATEGORY_LABEL: Record<Listing["category"], string> = {
  street_food: "Street food",
  eatery: "Eatery",
};

export default function Place() {
  const { id } = useParams();
  const listingId = Number(id);
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("helpful");

  const refresh = useCallback(async () => {
    const [l, r] = await Promise.all([getListing(listingId), getReviews(listingId, "recent")]);
    setListing(l);
    setReviews(r);
  }, [listingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching listing/review data on mount and on sort change
    refresh();
  }, [refresh]);

  const handleHelpful = async (reviewId: number) => {
    if (!userId) {
      navigate("/login");
      return;
    }
    try {
      await voteReviewHelpful(reviewId, userId);
      refresh();
    } catch {
      // already voted, or offline — silently ignore in this prototype
    }
  };

  const visibleReviews = useMemo(() => {
    let list = reviews;
    if (filter !== "all") {
      list = list.filter((r) => r[filter] !== null);
    }
    const sorted = [...list];
    switch (sort) {
      case "helpful":
        sorted.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "highest":
        sorted.sort((a, b) => b.star_rating - a.star_rating);
        break;
      case "lowest":
        sorted.sort((a, b) => a.star_rating - b.star_rating);
        break;
      case "verified":
        sorted.sort((a, b) => Number(b.is_verified_visit) - Number(a.is_verified_visit));
        break;
    }
    return sorted;
  }, [reviews, filter, sort]);

  if (!listing) {
    return <div className="px-4 md:px-8 py-8 text-sm text-ink-soft">Loading...</div>;
  }

  return (
    <div>
      <div className="px-4 md:px-8 pt-4 pb-2 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-soft">
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="px-4 md:px-8">
        {/* Community rating first, per Localio's review-first philosophy */}
        <div className="pt-2 pb-5">
          <RatingBadge value={listing.bayesian_avg} reviewCount={listing.review_count} size="lg" />
        </div>

        <div className="flex items-start justify-between gap-4 pb-6 border-b border-border-soft">
          <div>
            <h1 className="font-display font-semibold text-2xl">{listing.name}</h1>
            <p className="text-sm text-ink-soft mt-1">
              {CATEGORY_LABEL[listing.category]}
              {listing.landmark ? ` · Near ${listing.landmark}` : ""}
            </p>
            <div className="mt-1.5">
              <VerificationTierBadge tier={listing.verification_tier} />
            </div>
          </div>
          <Link
            to={`/write-review?listing=${listing.id}`}
            className="shrink-0 inline-flex items-center gap-1.5 bg-accent text-accent-ink font-medium px-4 py-2.5 rounded-full text-sm"
          >
            <PenLine size={15} />
            Write a review
          </Link>
        </div>

        {/* What people are saying */}
        <div className="py-5">
          <h2 className="font-display font-semibold text-lg mb-3">What people are saying</h2>

          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`pill shrink-0 ${filter === f.key ? "pill-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`text-xs shrink-0 ${
                  sort === s.key ? "text-accent-ink font-medium" : "text-ink-faint"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {visibleReviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              subtitle="Be the first person to tell your neighborhood about this place."
              action={
                <Link
                  to={`/write-review?listing=${listing.id}`}
                  className="inline-flex items-center gap-1.5 bg-accent text-accent-ink font-medium px-4 py-2.5 rounded-full text-sm"
                >
                  Write the first review
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {visibleReviews.map((r) => (
                <ReviewCard key={r.id} review={r} onMarkHelpful={handleHelpful} />
              ))}
            </div>
          )}
        </div>

        {/* About this place - deliberately after the review feed */}
        <div className="py-6 border-t border-border-soft">
          <h2 className="font-display font-semibold text-lg mb-3">About this place</h2>
          {listing.description && (
            <p className="text-sm mb-3 leading-relaxed">{listing.description}</p>
          )}
          <div className="card p-4 flex items-start gap-3">
            <MapPin size={18} className="text-ink-soft mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm">{listing.locality}</p>
              {listing.landmark && (
                <p className="text-sm text-ink-soft">Near {listing.landmark}</p>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent-ink font-medium mt-2"
              >
                <Navigation size={14} />
                Get directions
              </a>
            </div>
          </div>
          {!listing.description && (
            <p className="text-xs text-ink-faint mt-3">
              This business hasn't added a description yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
