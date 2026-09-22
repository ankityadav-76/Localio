from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlmodel import Session, select
from typing import Optional

from ..database import get_session
from ..models import Listing, Review, ReviewVote, User
from ..schemas import ReviewOut, VoteCreate
from ..services.geo import haversine_distance_m, VERIFIED_VISIT_RADIUS_M
from ..services.rating import bayesian_average

router = APIRouter(tags=["reviews"])


def _to_review_out(session: Session, review: Review) -> ReviewOut:
    """Joins in the reviewer's name/review-count so the frontend can show
    who left a review and how much credibility they've built up, without
    exposing anything beyond that (no phone number, no raw user record)."""
    user = session.get(User, review.user_id)
    data = review.model_dump()
    data["reviewer_name"] = user.name if user else None
    data["reviewer_review_count"] = user.review_count if user else 0
    return ReviewOut(**data)


def _recompute_listing_rating(session: Session, listing: Listing):
    reviews = session.exec(select(Review).where(Review.listing_id == listing.id)).all()
    n = len(reviews)
    raw_sum = sum(r.star_rating for r in reviews)
    listing.review_count = n
    listing.raw_avg = round(raw_sum / n, 2) if n else 0.0

    # global mean across all listings with at least one review, as the Bayesian prior
    all_listings = session.exec(select(Listing).where(Listing.review_count > 0)).all()
    if all_listings:
        global_mean = sum(l.raw_avg for l in all_listings) / len(all_listings)
    else:
        global_mean = 4.0  # reasonable neutral starting prior before any data exists

    listing.bayesian_avg = bayesian_average(raw_sum, n, global_mean)
    session.add(listing)


@router.post("/reviews", response_model=ReviewOut)
def create_review(
    listing_id: int = Form(...),
    user_id: int = Form(...),
    star_rating: int = Form(...),
    tag_taste: Optional[int] = Form(None),
    tag_value: Optional[int] = Form(None),
    tag_hygiene: Optional[int] = Form(None),
    tag_crowd: Optional[int] = Form(None),
    text: Optional[str] = Form(None),
    reviewer_lat: Optional[float] = Form(None),
    reviewer_lng: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    """
    The core <30s review flow: star rating (required) -> optional tags ->
    optional photo -> optional text. Verified-visit badge is set server-side
    by comparing the reviewer's reported GPS position against the listing's
    location at submit time, so it can't be faked by just typing a review.
    """
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = session.exec(
        select(Review).where(Review.listing_id == listing_id, Review.user_id == user_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already reviewed this listing")

    is_verified = False
    if reviewer_lat is not None and reviewer_lng is not None:
        dist = haversine_distance_m(reviewer_lat, reviewer_lng, listing.lat, listing.lng)
        is_verified = dist <= VERIFIED_VISIT_RADIUS_M

    photo_url = None
    if photo is not None:
        # Prototype: not persisting the actual file yet — wire this to
        # Cloudflare R2 / S3 upload before this is real. Placeholder keeps
        # the request/response contract stable for the frontend.
        photo_url = f"/uploads/{photo.filename}"

    review = Review(
        listing_id=listing_id,
        user_id=user_id,
        star_rating=star_rating,
        tag_taste=tag_taste,
        tag_value=tag_value,
        tag_hygiene=tag_hygiene,
        tag_crowd=tag_crowd,
        photo_url=photo_url,
        text=text,
        is_verified_visit=is_verified,
    )
    session.add(review)

    user.review_count += 1
    session.add(user)

    session.commit()
    session.refresh(review)

    _recompute_listing_rating(session, listing)
    session.commit()

    return _to_review_out(session, review)


@router.get("/listings/{listing_id}/reviews", response_model=list[ReviewOut])
def list_reviews(
    listing_id: int,
    sort: str = Query("helpful", pattern="^(helpful|recent)$"),
    session: Session = Depends(get_session),
):
    statement = select(Review).where(Review.listing_id == listing_id)
    reviews = session.exec(statement).all()
    if sort == "helpful":
        reviews.sort(key=lambda r: (r.helpful_count, r.created_at), reverse=True)
    else:
        reviews.sort(key=lambda r: r.created_at, reverse=True)
    return [_to_review_out(session, r) for r in reviews]


@router.post("/reviews/{review_id}/vote", response_model=ReviewOut)
def vote_review(review_id: int, payload: VoteCreate, session: Session = Depends(get_session)):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    existing_vote = session.exec(
        select(ReviewVote).where(ReviewVote.review_id == review_id, ReviewVote.user_id == payload.user_id)
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="User already voted on this review")

    vote = ReviewVote(review_id=review_id, user_id=payload.user_id, is_helpful=payload.is_helpful)
    session.add(vote)

    if payload.is_helpful:
        review.helpful_count += 1
        session.add(review)

    session.commit()
    session.refresh(review)
    return _to_review_out(session, review)
