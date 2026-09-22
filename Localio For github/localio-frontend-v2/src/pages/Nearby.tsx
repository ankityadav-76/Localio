import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { loadDiscoveryData } from "../lib/discovery";
import type { ReviewWithListing } from "../lib/discovery";
import type { Listing } from "../types";
import { StarRow } from "../components/ui/StarRow";
import { EmptyState } from "../components/ui/EmptyState";

type LocalityGroup = {
  locality: string;
  listings: Listing[];
};

export default function Nearby() {
  const [groups, setGroups] = useState<LocalityGroup[]>([]);
  const [topReviewByListing, setTopReviewByListing] = useState<Record<number, ReviewWithListing>>({});
  const [verifiedCountByListing, setVerifiedCountByListing] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscoveryData().then((data) => {
      const byLocality = new Map<string, Listing[]>();
      for (const listing of data.listings) {
        const list = byLocality.get(listing.locality) ?? [];
        list.push(listing);
        byLocality.set(listing.locality, list);
      }
      const groupList: LocalityGroup[] = [...byLocality.entries()].map(([locality, listings]) => ({
        locality,
        listings: listings.sort((a, b) => b.bayesian_avg - a.bayesian_avg),
      }));
      setGroups(groupList);

      const topByListing: Record<number, ReviewWithListing> = {};
      const verifiedCounts: Record<number, number> = {};
      for (const review of data.reviewsWithListing) {
        const existing = topByListing[review.listing_id];
        if (!existing || review.helpful_count > existing.helpful_count) {
          topByListing[review.listing_id] = review;
        }
        if (review.is_verified_visit) {
          verifiedCounts[review.listing_id] = (verifiedCounts[review.listing_id] ?? 0) + 1;
        }
      }
      setTopReviewByListing(topByListing);
      setVerifiedCountByListing(verifiedCounts);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 md:px-8 py-6">
      <h1 className="font-display font-semibold text-2xl mb-1">Nearby</h1>
      <p className="text-sm text-ink-soft mb-6">Grouped by locality and landmark, not exact address.</p>

      {loading && <p className="text-sm text-ink-soft">Loading...</p>}

      {!loading && groups.length === 0 && (
        <EmptyState title="Nothing nearby yet" subtitle="Seed some listings on the backend to populate this." />
      )}

      {groups.map((group) => (
        <section key={group.locality} className="mb-8">
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin size={15} className="text-ink-soft" />
            <h2 className="font-display font-semibold text-base">Around {group.locality}</h2>
          </div>

          <div className="flex flex-col gap-2">
            {group.listings.map((listing) => {
              const topReview = topReviewByListing[listing.id];
              const verifiedCount = verifiedCountByListing[listing.id] ?? 0;
              return (
                <Link key={listing.id} to={`/place/${listing.id}`} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRow value={listing.bayesian_avg} size={13} />
                        <span className="text-sm font-medium">
                          {listing.review_count > 0 ? listing.bayesian_avg.toFixed(1) : "New"}
                        </span>
                      </div>
                      <p className="font-display font-medium text-base truncate">{listing.name}</p>
                      {topReview?.text && (
                        <p className="text-sm text-ink-soft mt-1 line-clamp-1">"{topReview.text}"</p>
                      )}
                    </div>
                  </div>
                  {verifiedCount > 0 && (
                    <p className="text-xs text-ink-faint mt-2">
                      {verifiedCount} verified review{verifiedCount === 1 ? "" : "s"}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
