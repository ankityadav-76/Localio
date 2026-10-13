import Constants from "expo-constants";
import type { FoodOrder, Listing, MenuItem, RazorpayCheckoutOrder, Review, UserProfile, VendorDashboard } from "../types";

/**
 * Where the FastAPI backend lives.
 * - Set EXPO_PUBLIC_API_BASE for a deployed (HTTPS) backend.
 * - In development we reuse the IP of the machine running Metro, so a real
 *   phone on the same Wi-Fi reaches the backend without any config
 *   (start it with: uvicorn app.main:app --host 0.0.0.0 --port 8000).
 */
function resolveBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(":")[0]}:8000`;
  return "http://127.0.0.1:8000";
}
export const API_BASE = resolveBase();

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(0, `Can't reach the server at ${API_BASE}. Is the backend running?`);
  }
  if (!res.ok) {
    let message = `Something went wrong (${res.status}).`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      // keep the generic message
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function searchListings(params: { lat?: number; lng?: number; radiusM?: number; locality?: string; sort?: "rating" | "distance" } = {}) {
  const qs = new URLSearchParams();
  if (params.lat !== undefined) qs.set("lat", String(params.lat));
  if (params.lng !== undefined) qs.set("lng", String(params.lng));
  if (params.radiusM !== undefined) qs.set("radius_m", String(params.radiusM));
  if (params.locality) qs.set("locality", params.locality);
  if (params.sort) qs.set("sort", params.sort);
  return apiFetch<Listing[]>(`/listings?${qs.toString()}`);
}
export const getListing = (id: number) => apiFetch<Listing>(`/listings/${id}`);
export const getReviews = (listingId: number, sort: "helpful" | "recent" = "recent") =>
  apiFetch<Review[]>(`/listings/${listingId}/reviews?sort=${sort}`);
export const voteReviewHelpful = (reviewId: number, userId: number) =>
  apiFetch<Review>(`/reviews/${reviewId}/vote`, json("POST", { user_id: userId, is_helpful: true }));
export const submitReview = (form: FormData) => apiFetch<Review>(`/reviews`, { method: "POST", body: form });

export const sendOtp = (phoneNumber: string) =>
  apiFetch<{ message: string; dev_code: string }>(`/auth/otp/send`, json("POST", { phone_number: phoneNumber }));
export const verifyOtp = (phoneNumber: string, code: string, role?: "user" | "vendor") =>
  apiFetch<{ user_id: number; phone_number: string; is_vendor: boolean }>(
    `/auth/otp/verify`,
    json("POST", { phone_number: phoneNumber, code, role })
  );

export const getUser = (userId: number) => apiFetch<UserProfile>(`/users/${userId}`);
export const getUserReviews = (userId: number) => apiFetch<Review[]>(`/users/${userId}/reviews`);
export const matchContactReviewers = (phoneNumbers: string[]) =>
  apiFetch<number[]>("/users/contact-matches", json("POST", { phone_numbers: phoneNumbers }));

export const createVendorListing = (form: FormData) => apiFetch<Listing>(`/vendor/listings`, { method: "POST", body: form });
export const getMyVendorListings = (userId: number) => apiFetch<Listing[]>(`/vendor/listings/mine?user_id=${userId}`);
export const getVendorDashboard = (listingId: number, userId: number) =>
  apiFetch<VendorDashboard>(`/vendor/listings/${listingId}/dashboard?user_id=${userId}`);

export const getVendorMenu = (listingId: number) =>
  apiFetch<MenuItem[]>(`/listings/${listingId}/menu`);

export const createOrder = (payload: {
  listing_id: number;
  user_id: number;
  service: "Dine-In" | "Takeaway";
  items: Array<{ menu_item_id: number; quantity: number }>;
}) => apiFetch<RazorpayCheckoutOrder>("/orders", json("POST", payload));

export const verifyOrderPayment = (
  orderId: number,
  payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
) => apiFetch<FoodOrder>(`/orders/${orderId}/payment/verify`, json("POST", payload));
