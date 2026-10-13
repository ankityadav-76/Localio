export type Category = "street_food" | "eatery";
export type VerificationTier = "unverified" | "photo_verified" | "registered_business";

export type Listing = {
  id: number;
  name: string;
  category: Category;
  locality: string;
  landmark: string | null;
  lat: number;
  lng: number;
  description: string | null;
  photo_url: string | null;
  verification_tier: VerificationTier;
  claimed_by_user_id: number | null;
  review_count: number;
  raw_avg: number;
  bayesian_avg: number;
  distance_m: number | null;
  famous_for: string | null;
  is_open: boolean;
  crowd_level: "low" | "moderate" | "busy" | string;
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

export type UserProfile = { id: number; name: string | null; review_count: number; is_vendor: boolean };
export type Session = { userId: number; phoneNumber: string; isVendor: boolean };

export type MenuItem = {
  id: number;
  listing_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

export type FoodOrder = {
  id: number;
  listing_id: number;
  user_id: number;
  service: "Dine-In" | "Takeaway";
  status: string;
  menu_confirmation_required: boolean;
  total: number;
  created_at: string;
  items: Array<{
    menu_item_id: number | null;
    name: string;
    quantity: number;
    unit_price: number;
  }>;
};

export type RazorpayCheckoutOrder = FoodOrder & {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount_paise: number;
  currency: "INR";
};
