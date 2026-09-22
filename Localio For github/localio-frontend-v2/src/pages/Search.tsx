import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { searchListings } from "../lib/api";
import type { Listing } from "../types";
import { PlaceCard } from "../components/places/PlaceCard";
import { EmptyState } from "../components/ui/EmptyState";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [all, setAll] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching listing data on mount
    searchListings({ sort: "rating" })
      .then(setAll)
      .finally(() => setLoading(false));
  }, []);

  const results = query.trim()
    ? all.filter((l) => {
        const q = query.trim().toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.locality.toLowerCase().includes(q) ||
          (l.landmark ?? "").toLowerCase().includes(q) ||
          (l.category === "street_food" && "street food".includes(q))
        );
      })
    : [];

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2.5 bg-surface mb-6 max-w-lg">
        <SearchIcon size={16} className="text-ink-faint shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setParams({ q: query })}
          placeholder="vada pav, Manek Chowk, best chai..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
          autoFocus
        />
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading...</p>}

      {!loading && query.trim() && results.length === 0 && (
        <EmptyState title="No matches" subtitle={`Nothing found for "${query}" yet.`} />
      )}

      {!loading && !query.trim() && (
        <p className="text-sm text-ink-soft">Search for a place, dish, locality, or landmark.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map((l) => (
          <PlaceCard key={l.id} listing={l} fill />
        ))}
      </div>
    </div>
  );
}
