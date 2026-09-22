from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select

from ..database import get_session
from ..models import Listing, User, Review
from ..schemas import ListingOut, VendorDashboardOut, ReviewOut
from ..services.geo import haversine_distance_m, VERIFIED_VISIT_RADIUS_M

router = APIRouter(prefix="/vendor", tags=["vendor"])


def _compute_verification_tier(has_photo: bool, has_gst: bool) -> str:
    if has_gst:
        return "registered_business"
    if has_photo:
        return "photo_verified"
    return "unverified"


@router.post("/listings", response_model=ListingOut)
def create_vendor_listing(
    user_id: int = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    locality: str = Form(...),
    landmark: Optional[str] = Form(None),
    lat: float = Form(...),
    lng: float = Form(...),
    description: Optional[str] = Form(None),
    gst_number: Optional[str] = Form(None),
    vendor_lat: Optional[float] = Form(None),
    vendor_lng: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    """
    One-time business claim/create flow. Photo verification is location-gated
    the same way review verified-visits are: the vendor's device location at
    submit time has to be near the business location they're entering, so
    this can't be claimed from someone's living room. GST number, if given,
    upgrades the tier further — but it's optional, since most street vendors
    are legitimately under the GST registration threshold and shouldn't be
    excluded from a "verified" badge just for that.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = session.exec(select(Listing).where(Listing.claimed_by_user_id == user_id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="This account has already claimed a listing")

    has_verified_location = False
    if vendor_lat is not None and vendor_lng is not None:
        dist = haversine_distance_m(vendor_lat, vendor_lng, lat, lng)
        has_verified_location = dist <= VERIFIED_VISIT_RADIUS_M

    photo_url = None
    if photo is not None:
        # Prototype: not persisting the actual file yet — same placeholder
        # approach as review photos, wire to real storage before launch.
        photo_url = f"/uploads/{photo.filename}"

    has_photo = photo_url is not None and has_verified_location
    has_gst = bool(gst_number and gst_number.strip())

    listing = Listing(
        name=name,
        category=category,
        locality=locality,
        landmark=landmark,
        lat=lat,
        lng=lng,
        is_seeded=False,
        claimed_by_user_id=user_id,
        description=description,
        photo_url=photo_url,
        gst_number=gst_number,
        verification_tier=_compute_verification_tier(has_photo, has_gst),
    )
    session.add(listing)

    user.is_vendor = True
    session.add(user)

    session.commit()
    session.refresh(listing)
    return listing


@router.get("/listings/mine", response_model=list[ListingOut])
def get_my_listings(user_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Listing).where(Listing.claimed_by_user_id == user_id)).all()


@router.get("/listings/{listing_id}/dashboard", response_model=VendorDashboardOut)
def get_vendor_dashboard(listing_id: int, user_id: int, session: Session = Depends(get_session)):
    """Read-only: rating, review count, helpful-vote totals, and the recent
    reviews themselves — but nothing here lets a vendor edit, hide, or reply
    to a review. That line is intentional, not a v2 feature."""
    from .reviews import _to_review_out  # local import avoids a circular import at module load

    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.claimed_by_user_id != user_id:
        raise HTTPException(status_code=403, detail="This listing isn't claimed by this account")

    reviews = session.exec(select(Review).where(Review.listing_id == listing_id)).all()
    reviews.sort(key=lambda r: r.created_at, reverse=True)
    total_helpful = sum(r.helpful_count for r in reviews)

    return VendorDashboardOut(
        listing=listing,
        total_helpful_votes=total_helpful,
        recent_reviews=[_to_review_out(session, r) for r in reviews[:10]],
    )
