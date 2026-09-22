from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ListingCreate(BaseModel):
    name: str
    category: str
    locality: str
    landmark: Optional[str] = None
    lat: float
    lng: float


class ListingOut(BaseModel):
    id: int
    name: str
    category: str
    locality: str
    landmark: Optional[str]
    lat: float
    lng: float
    description: Optional[str] = None
    photo_url: Optional[str] = None
    verification_tier: str = "unverified"
    claimed_by_user_id: Optional[int] = None
    review_count: int
    raw_avg: float
    bayesian_avg: float
    distance_m: Optional[float] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    listing_id: int
    user_id: int  # normally taken from auth token; explicit here since there's no auth wired yet
    star_rating: int = Field(ge=1, le=5)
    tag_taste: Optional[int] = Field(default=None, ge=1, le=5)
    tag_value: Optional[int] = Field(default=None, ge=1, le=5)
    tag_hygiene: Optional[int] = Field(default=None, ge=1, le=5)
    tag_crowd: Optional[int] = Field(default=None, ge=1, le=5)
    text: Optional[str] = None
    reviewer_lat: Optional[float] = None
    reviewer_lng: Optional[float] = None


class ReviewOut(BaseModel):
    id: int
    listing_id: int
    user_id: int
    reviewer_name: Optional[str] = None
    reviewer_review_count: int = 0
    star_rating: int
    tag_taste: Optional[int]
    tag_value: Optional[int]
    tag_hygiene: Optional[int]
    tag_crowd: Optional[int]
    photo_url: Optional[str]
    text: Optional[str]
    is_verified_visit: bool
    helpful_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class VoteCreate(BaseModel):
    user_id: int
    is_helpful: bool = True


class UserOut(BaseModel):
    id: int
    name: Optional[str]
    review_count: int
    is_vendor: bool = False

    class Config:
        from_attributes = True


class VendorDashboardOut(BaseModel):
    listing: ListingOut
    total_helpful_votes: int
    recent_reviews: list[ReviewOut]


class OtpSendRequest(BaseModel):
    phone_number: str


class OtpVerifyRequest(BaseModel):
    phone_number: str
    code: str
    role: Optional[str] = None  # "user" | "vendor" — only meaningful on first login
