import type { Listing, Review, VendorDashboard } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function searchListings(params: {
  lat?: number;
  lng?: number;
  radiusM?: number;
  locality?: string;
  sort?: "rating" | "distance";
}) {
  const qs = new URLSearchParams();
  if (params.lat !== undefined) qs.set("lat", String(params.lat));
  if (params.lng !== undefined) qs.set("lng", String(params.lng));
  if (params.radiusM !== undefined) qs.set("radius_m", String(params.radiusM));
  if (params.locality) qs.set("locality", params.locality);
  if (params.sort) qs.set("sort", params.sort);
  return apiFetch<Listing[]>(`/listings?${qs.toString()}`);
}

export function getListing(id: number) {
  return apiFetch<Listing>(`/listings/${id}`);
}

export function getReviews(listingId: number, sort: "helpful" | "recent" = "helpful") {
  return apiFetch<Review[]>(`/listings/${listingId}/reviews?sort=${sort}`);
}

export function voteReviewHelpful(reviewId: number, userId: number) {
  return apiFetch<Review>(`/reviews/${reviewId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, is_helpful: true }),
  });
}

export function submitReview(form: FormData) {
  return apiFetch<Review>(`/reviews`, { method: "POST", body: form });
}

export function createVendorListing(form: FormData) {
  return apiFetch<Listing>(`/vendor/listings`, { method: "POST", body: form });
}

export function getMyVendorListings(userId: number) {
  return apiFetch<Listing[]>(`/vendor/listings/mine?user_id=${userId}`);
}

export function getVendorDashboard(listingId: number, userId: number) {
  return apiFetch<VendorDashboard>(`/vendor/listings/${listingId}/dashboard?user_id=${userId}`);
}

export function getUser(userId: number) {
  return apiFetch<{ id: number; name: string | null; review_count: number }>(`/users/${userId}`);
}

export function getUserReviews(userId: number) {
  return apiFetch<Review[]>(`/users/${userId}/reviews`);
}

export function sendOtp(phoneNumber: string) {
  return apiFetch<{ message: string; dev_code: string }>(`/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
}

export function verifyOtp(phoneNumber: string, code: string, role?: "user" | "vendor") {
  return apiFetch<{ user_id: number; phone_number: string; is_vendor: boolean }>(`/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber, code, role }),
  });
}
