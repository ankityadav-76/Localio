export type Category = "street_food" | "eatery";

export type Listing = {
  id: number;
  name: string;
  category: "street_food" | "eatery";
  locality: string;
  landmark: string | null;
  lat: number;
  lng: number;
  description: string | null;
  photo_url: string | null;
  verification_tier: "unverified" | "photo_verified" | "registered_business";
  claimed_by_user_id: number | null;
  review_count: number;
  raw_avg: number;
  bayesian_avg: number;
  distance_m: number | null;
};

export type Review = {
  id: number;
  listing_id: number;
  user_id: number;
  reviewer_name: string | null;
  reviewer_review_count: number;
  star_rating: number;
  tag_taste: number | null;
  tag_value: number | null;
  tag_hygiene: number | null;
  tag_crowd: number | null;
  photo_url: string | null;
  text: string | null;
  is_verified_visit: boolean;
  helpful_count: number;
  created_at: string;
};

export type VendorDashboard = {
  listing: Listing;
  total_helpful_votes: number;
  recent_reviews: Review[];
};
