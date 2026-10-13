from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class ListingCreate(BaseModel):
    name: str
    category: str
    locality: str
    landmark: Optional[str] = None
    lat: float
    lng: float
    famous_for: Optional[str] = None
    is_open: bool = True
    crowd_level: str = "moderate"


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
    famous_for: Optional[str] = None
    is_open: bool = True
    crowd_level: str = "moderate"

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


class ContactMatchRequest(BaseModel):
    phone_numbers: list[str] = Field(min_length=1, max_length=1000)

    @field_validator("phone_numbers")
    @classmethod
    def validate_phone_numbers(cls, values: list[str]) -> list[str]:
        for value in values:
            digits = "".join(character for character in value if character.isdigit())
            if not 7 <= len(digits) <= 15:
                raise ValueError("Each contact phone number must contain 7 to 15 digits")
        return values


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


class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(ge=0)
    image_url: Optional[str] = None
    is_available: bool = True


class MenuItemOut(BaseModel):
    id: int
    listing_id: int
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(ge=1, le=50)


class OrderCreate(BaseModel):
    listing_id: int
    user_id: int
    service: Literal["Dine-In", "Takeaway"]
    items: list[OrderItemCreate] = Field(min_length=1, max_length=30)


class OrderItemOut(BaseModel):
    menu_item_id: Optional[int]
    name: str
    quantity: int
    unit_price: float


class OrderOut(BaseModel):
    id: int
    listing_id: int
    user_id: int
    service: str
    status: str
    menu_confirmation_required: bool
    total: float
    created_at: datetime
    items: list[OrderItemOut]


class OrderCheckoutOut(OrderOut):
    razorpay_order_id: str
    razorpay_key_id: str
    amount_paise: int
    currency: Literal["INR"] = "INR"


class RazorpayPaymentVerification(BaseModel):
    razorpay_order_id: str = Field(pattern=r"^order_[A-Za-z0-9]+$", max_length=64)
    razorpay_payment_id: str = Field(pattern=r"^pay_[A-Za-z0-9]+$", max_length=64)
    razorpay_signature: str = Field(pattern=r"^[A-Fa-f0-9]{64}$")
