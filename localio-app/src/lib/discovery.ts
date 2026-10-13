import { getReviews, searchListings } from "./api";
import type { Listing, Review } from "../types";

export type ReviewWithListing = Review & { listing: Listing };

/**
 * The backend has no curated "trending / hidden gems" feeds yet, so these are
 * derived client-side from listings + their reviews (fine at prototype scale).
 */
export async function loadDiscoveryData() {
  const listings = await searchListings({ sort: "rating" });
  const reviewLists = await Promise.all(listings.map((l) => getReviews(l.id, "recent").catch(() => [] as Review[])));

  const reviewsWithListing: ReviewWithListing[] = [];
  listings.forEach((listing, i) => reviewLists[i].forEach((r) => reviewsWithListing.push({ ...r, listing })));

  const time = (r: Review) => new Date(r.created_at).getTime();
  return {
    listings,
    reviewsWithListing,
    peopleAreTalkingAbout: [...reviewsWithListing].sort((a, b) => b.helpful_count - a.helpful_count).slice(0, 6),
    trendingNearby: listings.filter((l) => l.review_count > 0).sort((a, b) => b.review_count - a.review_count).slice(0, 6),
    hiddenGems: listings.filter((l) => l.review_count > 0 && l.review_count <= 3 && l.bayesian_avg >= 4).slice(0, 6),
    highlyRatedVerified: listings.filter((l) => l.review_count > 0).sort((a, b) => b.bayesian_avg - a.bayesian_avg).slice(0, 6),
    recentlyReviewed: [...reviewsWithListing].sort((a, b) => time(b) - time(a)).slice(0, 6),
  };
}
