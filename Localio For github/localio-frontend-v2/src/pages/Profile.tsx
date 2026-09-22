import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUser, getUserReviews, getListing } from "../lib/api";
import type { Listing, Review } from "../types";
import { Avatar } from "../components/ui/Avatar";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { id } = useParams();
  const userId = Number(id);
  const { logout, userId: currentUserId } = useAuth();

  const [user, setUser] = useState<{ id: number; name: string | null; review_count: number } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [places, setPlaces] = useState<Record<number, Listing>>({});

  useEffect(() => {
    getUser(userId).then(setUser);
    getUserReviews(userId).then(async (rs) => {
      setReviews(rs);
      const uniqueListingIds = [...new Set(rs.map((r) => r.listing_id))];
      const fetched = await Promise.all(uniqueListingIds.map((lid) => getListing(lid)));
      const map: Record<number, Listing> = {};
      fetched.forEach((l) => (map[l.id] = l));
      setPlaces(map);
    });
  }, [userId]);

  const verifiedCount = reviews.filter((r) => r.is_verified_visit).length;

  if (!user) {
    return <div className="px-4 md:px-8 py-8 text-sm text-ink-soft">Loading...</div>;
  }

  const name = user.name?.trim() || "A Localio reviewer";

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Avatar name={name} size={56} />
        <div>
          <p className="font-display font-semibold text-xl">{name}</p>
          <p className="text-sm text-ink-soft">
            {user.review_count} reviews · {verifiedCount} verified visits
          </p>
        </div>
      </div>

      {currentUserId === userId && (
        <button onClick={logout} className="text-xs text-ink-soft underline underline-offset-2 mb-6">
          Log out
        </button>
      )}

      <h2 className="font-display font-semibold text-lg mt-6 mb-3">Review history</h2>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" subtitle="Reviews this person posts will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} place={places[r.listing_id]} />
          ))}
        </div>
      )}
    </div>
  );
}
