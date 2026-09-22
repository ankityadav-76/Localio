from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..database import get_session
from ..models import Listing
from ..schemas import ListingCreate, ListingOut
from ..services.geo import haversine_distance_m

router = APIRouter(prefix="/listings", tags=["listings"])


@router.post("", response_model=ListingOut)
def create_listing(payload: ListingCreate, session: Session = Depends(get_session)):
    """Used by the seed script (and later, self-serve business claiming) to add listings."""
    listing = Listing(**payload.model_dump())
    session.add(listing)
    session.commit()
    session.refresh(listing)
    return listing


@router.get("", response_model=list[ListingOut])
def search_listings(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_m: int = 2000,
    locality: Optional[str] = None,
    sort: str = Query("rating", pattern="^(rating|distance)$"),
    session: Session = Depends(get_session),
):
    """
    Nearby search. Pass lat/lng for a radius search around a point (e.g. the
    user's GPS position or a geocoded landmark). Pass locality for a plain
    text-match fallback. This does the distance filter in Python for now —
    swap for PostGIS ST_DWithin once on Postgres, same response shape.
    """
    statement = select(Listing)
    if locality:
        statement = statement.where(Listing.locality.ilike(f"%{locality}%"))
    listings = session.exec(statement).all()

    results = []
    for listing in listings:
        out = ListingOut.model_validate(listing)
        if lat is not None and lng is not None:
            dist = haversine_distance_m(lat, lng, listing.lat, listing.lng)
            if dist > radius_m:
                continue
            out.distance_m = round(dist, 1)
        results.append(out)

    if sort == "distance" and lat is not None and lng is not None:
        results.sort(key=lambda r: r.distance_m)
    else:
        results.sort(key=lambda r: r.bayesian_avg, reverse=True)

    return results


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, session: Session = Depends(get_session)):
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
