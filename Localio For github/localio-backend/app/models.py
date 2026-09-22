from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone_number: str = Field(index=True, unique=True)
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    review_count: int = 0
    is_vendor: bool = False


class Listing(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str  # "street_food" | "eatery"
    locality: str
    landmark: Optional[str] = None
    lat: float
    lng: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_seeded: bool = True
    claimed_by_user_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # vendor-supplied business info (set once, at claim time)
    description: Optional[str] = None
    photo_url: Optional[str] = None
    gst_number: Optional[str] = None
    # "unverified" | "photo_verified" | "registered_business"
    verification_tier: str = "unverified"

    # denormalized rating fields, recomputed after each review/vote
    review_count: int = 0
    raw_avg: float = 0.0
    bayesian_avg: float = 0.0


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    star_rating: int  # 1-5
    tag_taste: Optional[int] = None   # 1-5, optional per-tag ratings
    tag_value: Optional[int] = None
    tag_hygiene: Optional[int] = None
    tag_crowd: Optional[int] = None
    photo_url: Optional[str] = None
    text: Optional[str] = None
    is_verified_visit: bool = False
    helpful_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReviewVote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    review_id: int = Field(foreign_key="review.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    is_helpful: bool = True
