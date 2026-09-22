import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, PenLine } from "lucide-react";
import { loadDiscoveryData } from "../lib/discovery";
import type { ReviewWithListing } from "../lib/discovery";
import type { Listing } from "../types";
import { DiscoveryRow } from "../components/discovery/DiscoveryRow";
import { PlaceCard } from "../components/places/PlaceCard";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { EmptyState } from "../components/ui/EmptyState";

type DiscoveryData = {
  peopleAreTalkingAbout: ReviewWithListing[];
  trendingNearby: Listing[];
  hiddenGems: Listing[];
  highlyRatedVerified: Listing[];
  recentlyReviewed: ReviewWithListing[];
};

export default function Home() {
  const [data, setData] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadDiscoveryData()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {/* Hero - compact, transitions quickly into real content */}
      <section className="px-4 md:px-8 pt-8 pb-6 md:pt-14 md:pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-display font-semibold text-3xl md:text-5xl leading-tight max-w-2xl"
        >
          Find the places locals actually talk about.
        </motion.h1>
        <p className="text-ink-soft mt-3 max-w-md text-base">
          Real reviews. Real visits. Hidden gems around your neighborhood.
        </p>
        <div className="flex items-center gap-3 mt-5">
          <Link
            to="/nearby"
            className="inline-flex items-center gap-2 bg-accent text-accent-ink font-medium px-5 py-2.5 rounded-full text-sm"
          >
            <Compass size={16} />
            Explore nearby
          </Link>
          <Link
            to="/write-review"
            className="inline-flex items-center gap-2 text-ink font-medium px-5 py-2.5 rounded-full text-sm border border-border"
          >
            <PenLine size={16} />
            Write a review
          </Link>
        </div>
      </section>

      {loading && (
        <div className="px-4 md:px-8 py-8 text-sm text-ink-soft">Loading what's around you...</div>
      )}

      {!loading && data && data.peopleAreTalkingAbout.length === 0 && (
        <EmptyState
          title="Nothing here yet"
          subtitle="Seed some listings on the backend to see the discovery feed come alive."
        />
      )}

      {!loading && data && data.peopleAreTalkingAbout.length > 0 && (
        <>
          <DiscoveryRow
            title="People are talking about..."
            subtitle="The most helpful reviews from around the neighborhood"
          >
            {data.peopleAreTalkingAbout.map((r) => (
              <div key={r.id} className="w-80 shrink-0">
                <ReviewCard review={r} place={r.listing} />
              </div>
            ))}
          </DiscoveryRow>

          {data.trendingNearby.length > 0 && (
            <DiscoveryRow title="Trending nearby" subtitle="Places gaining attention right now">
              {data.trendingNearby.map((l) => (
                <PlaceCard key={l.id} listing={l} />
              ))}
            </DiscoveryRow>
          )}

          {data.hiddenGems.length > 0 && (
            <DiscoveryRow title="Hidden gems" subtitle="Strong reviews, still flying under the radar">
              {data.hiddenGems.map((l) => (
                <PlaceCard key={l.id} listing={l} />
              ))}
            </DiscoveryRow>
          )}

          {data.highlyRatedVerified.length > 0 && (
            <DiscoveryRow title="Highly rated by verified visitors" subtitle="Trust-driven picks">
              {data.highlyRatedVerified.map((l) => (
                <PlaceCard key={l.id} listing={l} />
              ))}
            </DiscoveryRow>
          )}

          {data.recentlyReviewed.length > 0 && (
            <DiscoveryRow title="Recently reviewed" subtitle="Fresh activity from the community">
              {data.recentlyReviewed.map((r) => (
                <div key={r.id} className="w-80 shrink-0">
                  <ReviewCard review={r} place={r.listing} compact />
                </div>
              ))}
            </DiscoveryRow>
          )}
        </>
      )}
    </div>
  );
}
