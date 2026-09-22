from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..database import get_session
from ..models import User, Review
from ..schemas import UserOut, ReviewOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/reviews", response_model=list[ReviewOut])
def get_user_reviews(
    user_id: int,
    sort: str = Query("recent", pattern="^(recent|helpful)$"),
    session: Session = Depends(get_session),
):
    """A reviewer's own review history, for their public profile page —
    what builds (or undermines) their credibility to other users."""
    from .reviews import _to_review_out  # local import avoids a circular import at module load

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reviews = session.exec(select(Review).where(Review.user_id == user_id)).all()
    if sort == "helpful":
        reviews.sort(key=lambda r: r.helpful_count, reverse=True)
    else:
        reviews.sort(key=lambda r: r.created_at, reverse=True)
    return [_to_review_out(session, r) for r in reviews]
