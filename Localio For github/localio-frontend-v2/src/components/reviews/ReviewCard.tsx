import { Link } from "react-router-dom";
import { Heart, MapPin, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import type { Review, Listing } from "../../types";
import { Avatar } from "../ui/Avatar";
import { StarRow } from "../ui/StarRow";
import { VerifiedBadge } from "../trust/VerifiedBadge";
import { useState } from "react";

const TAGS: { key: keyof Review; label: string }[] = [
  { key: "tag_taste", label: "Taste" },
  { key: "tag_value", label: "Value" },
  { key: "tag_hygiene", label: "Hygiene" },
  { key: "tag_crowd", label: "Crowd" },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

export function ReviewCard({
  review,
  place,
  onMarkHelpful,
  compact = false,
}: {
  review: Review;
  place?: Listing;
  onMarkHelpful?: (id: number) => void;
  compact?: boolean;
}) {
  const [justMarked, setJustMarked] = useState(false);
  const name = review.reviewer_name?.trim() || "A Localio reviewer";
  const activeTags = TAGS.filter((t) => review[t.key] !== null);

  const handleHelpful = () => {
    if (!onMarkHelpful || justMarked) return;
    setJustMarked(true);
    onMarkHelpful(review.id);
  };

  return (
    <div className="card p-4">
      {/* Reviewer + verification */}
      <div className="flex items-center gap-3">
        <Avatar name={name} size={38} />
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            {review.is_verified_visit && <VerifiedBadge />}
            <span>
              {review.reviewer_review_count} review{review.reviewer_review_count === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <span className="ml-auto text-xs text-ink-faint shrink-0">{timeAgo(review.created_at)}</span>
      </div>

      {/* Rating */}
      <div className="mt-3">
        <StarRow value={review.star_rating} size={15} />
      </div>

      {/* Photo */}
      {review.photo_url && !compact && (
        <div
          className="mt-3 rounded-lg overflow-hidden border border-border-soft flex items-center justify-center"
          style={{ aspectRatio: "4 / 3", background: "var(--border-soft)" }}
        >
          <ImageOff size={20} className="text-ink-faint" />
        </div>
      )}

      {/* Review text */}
      {review.text && <p className="mt-3 text-sm leading-relaxed text-ink">{review.text}</p>}

      {/* Tags */}
      {activeTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeTags.map((t) => (
            <span key={t.key} className="pill">
              {t.label}
            </span>
          ))}
        </div>
      )}

      {/* Helpful */}
      <div className="mt-3 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleHelpful}
          className="flex items-center gap-1.5 text-xs text-ink-soft"
        >
          <Heart
            size={15}
            strokeWidth={1.75}
            fill={justMarked ? "var(--star)" : "none"}
            color={justMarked ? "var(--star)" : "currentColor"}
          />
          {review.helpful_count + (justMarked ? 1 : 0)} found this helpful
        </motion.button>
      </div>

      {/* Place context */}
      {place && (
        <Link
          to={`/place/${place.id}`}
          className="mt-3 pt-3 border-t border-border-soft flex items-center gap-1.5 text-xs text-ink-soft"
        >
          <MapPin size={13} />
          <span className="truncate">
            {place.name}
            {place.landmark ? ` · Near ${place.landmark}` : ""}
          </span>
        </Link>
      )}
    </div>
  );
}
