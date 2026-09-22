import { searchListings, getReviews } from "./api";
import type { Listing, Review } from "../types";

export type ReviewWithListing = Review & { listing: Listing };

/**
 * Backend doesn't expose curated "trending" / "hidden gems" / etc feeds yet,
 * so this pulls the seeded listings + their reviews and derives reasonable
 * client-side heuristics for the homepage sections. Swap for real backend
 * aggregation endpoints once there's enough review volume to make server-side
 * ranking worthwhile.
 */
export async function loadDiscoveryData(locality?: string) {
  const listings = await searchListings({ locality, sort: "rating" });

  const reviewLists = await Promise.all(
    listings.map((listing) => getReviews(listing.id, "recent").catch(() => [] as Review[]))
  );

  const reviewsWithListing: ReviewWithListing[] = [];
  listings.forEach((listing, i) => {
    for (const review of reviewLists[i]) {
      reviewsWithListing.push({ ...review, listing });
    }
  });

  const byRecency = [...reviewsWithListing].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const peopleAreTalkingAbout = [...reviewsWithListing]
    .sort((a, b) => b.helpful_count - a.helpful_count)
    .slice(0, 6);

  const trendingNearby = [...listings]
    .filter((l) => l.review_count > 0)
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 6);

  const hiddenGems = [...listings]
    .filter((l) => l.review_count > 0 && l.review_count <= 3 && l.bayesian_avg >= 4)
    .slice(0, 6);

  const highlyRatedVerified = [...listings]
    .filter((l) => l.review_count > 0)
    .sort((a, b) => b.bayesian_avg - a.bayesian_avg)
    .slice(0, 6);

  const recentlyReviewed = byRecency.slice(0, 6);

  return {
    listings,
    reviewsWithListing,
    peopleAreTalkingAbout,
    trendingNearby,
    hiddenGems,
    highlyRatedVerified,
    recentlyReviewed,
  };
}
