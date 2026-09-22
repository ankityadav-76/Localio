import { useEffect, useMemo, useState } from "react";
import { searchListings } from "../lib/api";
import type { Listing } from "../types";
import { PlaceCard } from "../components/places/PlaceCard";
import { EmptyState } from "../components/ui/EmptyState";

const CATEGORIES: { key: "all" | Listing["category"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "street_food", label: "Street Food" },
  { key: "eatery", label: "Meals" },
];

const SORTS = [
  { key: "trending", label: "Trending" },
  { key: "hidden", label: "Hidden gems" },
  { key: "highest", label: "Highly rated" },
  { key: "most_reviewed", label: "Most reviewed" },
  { key: "recent", label: "Recently discovered" },
] as const;

export default function Explore() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("trending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchListings({ sort: "rating" })
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    let list = category === "all" ? listings : listings.filter((l) => l.category === category);
    const sorted = [...list];
    switch (sort) {
      case "trending":
      case "most_reviewed":
        sorted.sort((a, b) => b.review_count - a.review_count);
        break;
      case "hidden":
        sorted.sort((a, b) => {
          const aScore = a.review_count > 0 && a.review_count <= 3 ? a.bayesian_avg : -1;
          const bScore = b.review_count > 0 && b.review_count <= 3 ? b.bayesian_avg : -1;
          return bScore - aScore;
        });
        break;
      case "highest":
        sorted.sort((a, b) => b.bayesian_avg - a.bayesian_avg);
        break;
      case "recent":
        sorted.sort((a, b) => b.id - a.id);
        break;
    }
    return sorted;
  }, [listings, category, sort]);

  return (
    <div className="px-4 md:px-8 py-6">
      <h1 className="font-display font-semibold text-2xl mb-1">Explore</h1>
      <p className="text-sm text-ink-soft mb-5">Browse the neighborhood's local culture.</p>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`pill shrink-0 ${category === c.key ? "pill-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`text-xs shrink-0 ${sort === s.key ? "text-accent-ink font-medium" : "text-ink-faint"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading...</p>}

      {!loading && visible.length === 0 && (
        <EmptyState title="Nothing here yet" subtitle="Try a different category." />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((l) => (
          <PlaceCard key={l.id} listing={l} fill />
        ))}
      </div>
    </div>
  );
}
