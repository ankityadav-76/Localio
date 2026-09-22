import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Camera, Check, Search } from "lucide-react";
import { getListing, searchListings, submitReview } from "../lib/api";
import type { Listing } from "../types";
import { useAuth } from "../hooks/useAuth";

const TAGS = [
  { key: "tag_taste", label: "Taste" },
  { key: "tag_value", label: "Value" },
  { key: "tag_hygiene", label: "Hygiene" },
  { key: "tag_crowd", label: "Crowd" },
] as const;

function PlacePicker({ onPick }: { onPick: (l: Listing) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    const r = await searchListings({ locality: query.trim(), sort: "rating" });
    setResults(r);
  };

  return (
    <div>
      <p className="text-sm text-ink-soft mb-3">Which place are you reviewing?</p>
      <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2.5 bg-surface mb-4">
        <Search size={16} className="text-ink-faint shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search by locality or landmark"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>
      {searched && results.length === 0 && (
        <p className="text-sm text-ink-soft">Nothing found there yet.</p>
      )}
      <div className="flex flex-col gap-2">
        {results.map((l) => (
          <button
            key={l.id}
            onClick={() => onPick(l)}
            className="card p-3 text-left flex items-center justify-between"
          >
            <span className="text-sm font-medium">{l.name}</span>
            <span className="text-xs text-ink-soft">{l.locality}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WriteReview() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const listingParam = params.get("listing");
  const [listing, setListing] = useState<Listing | null>(null);

  const [star, setStar] = useState(0);
  const [tags, setTags] = useState<Record<string, number | undefined>>({});
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listingParam) {
      getListing(Number(listingParam)).then(setListing).catch(() => {});
    }
  }, [listingParam]);

  if (!userId) {
    return (
      <div className="px-4 md:px-8 py-10 max-w-md">
        <p className="font-display font-semibold text-xl mb-2">Log in to leave a review</p>
        <p className="text-sm text-ink-soft mb-4">
          A quick phone verification keeps reviews tied to real visits.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center bg-accent text-accent-ink font-medium px-5 py-2.5 rounded-full text-sm"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-md">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-soft mb-4">
          <ArrowLeft size={16} />
          Back
        </button>
        <PlacePicker onPick={setListing} />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (star === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    setError(null);

    let lat = listing.lat;
    let lng = listing.lng;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // fall back to listing coordinates if permission denied / no GPS
      }
    }

    const form = new FormData();
    form.set("listing_id", String(listing.id));
    form.set("user_id", String(userId));
    form.set("star_rating", String(star));
    form.set("reviewer_lat", String(lat));
    form.set("reviewer_lng", String(lng));
    if (text) form.set("text", text);
    for (const [key, value] of Object.entries(tags)) {
      if (value !== undefined) form.set(key, String(value));
    }
    if (photo) form.set("photo", photo);

    try {
      await submitReview(form);
      setDone(true);
      setTimeout(() => navigate(`/place/${listing.id}`), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="px-4 md:px-8 py-16 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--trust-soft)" }}
        >
          <Check size={26} color="var(--trust)" />
        </motion.div>
        <p className="font-display font-semibold text-xl">Posted</p>
        <p className="text-sm text-ink-soft mt-1">Thanks for telling the neighborhood.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-soft mb-4">
        <ArrowLeft size={16} />
        Back
      </button>

      <p className="text-xs text-ink-faint">Reviewing</p>
      <p className="font-display font-semibold text-xl mb-6">{listing.name}</p>

      <p className="text-sm font-medium mb-2">How was it?</p>
      <div className="flex gap-1 mb-7">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={() => setStar(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={34}
              strokeWidth={1.5}
              fill={n <= star ? "var(--star)" : "none"}
              color="var(--star)"
            />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {star > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-sm font-medium mb-2">Rate the experience (optional)</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {TAGS.map((tag) => (
                <div key={tag.key}>
                  <label className="text-xs text-ink-soft block mb-1">{tag.label}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setTags((prev) => ({
                            ...prev,
                            [tag.key]: prev[tag.key] === n ? undefined : n,
                          }))
                        }
                      >
                        <Star
                          size={16}
                          strokeWidth={1.5}
                          fill={(tags[tag.key] ?? 0) >= n ? "var(--star)" : "none"}
                          color="var(--star)"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm font-medium mb-2">Add a photo (optional)</p>
            <label className="card flex items-center gap-2 p-3 mb-6 cursor-pointer text-sm text-ink-soft w-fit">
              <Camera size={16} />
              {photo ? photo.name : "Add a photo"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>

            <p className="text-sm font-medium mb-2">Anything else? (optional)</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell people what they should know..."
              rows={3}
              className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-6 resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-sm mb-3" style={{ color: "var(--star)" }}>{error}</p>}

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={handleSubmit}
        disabled={submitting || star === 0}
        className="w-full bg-accent text-accent-ink font-medium py-3 rounded-full disabled:opacity-40"
      >
        {submitting ? "Posting..." : "Post review"}
      </motion.button>
    </div>
  );
}
