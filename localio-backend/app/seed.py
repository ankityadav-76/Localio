"""
Seeds the DB with realistic listings, reviewers, and reviews for one
micro-area so the discovery sections (trending, hidden gems, highly rated,
recently reviewed) have something real to compute from. Replace with your
actual manually-collected 20-50 listings for the chosen V1 micro-area before
this goes anywhere near real users.

Run with: python -m app.seed
"""
import random
from datetime import datetime, timedelta, timezone
from sqlmodel import Session
from .database import engine, init_db
from .models import Listing, User, Review, MenuItem
from .routers.reviews import _recompute_listing_rating
from .routers.vendor import _compute_verification_tier

SAMPLE_LISTINGS = [
    {"name": "Raju Vada Pav", "famous_for": "Crispy vada pav & spicy chutney", "category": "street_food", "locality": "CG Road", "landmark": "Near Fun Republic", "lat": 23.0225, "lng": 72.5714},
    {"name": "Manek Chowk Chaat Corner", "famous_for": "Late-night chaat & pav bhaji", "category": "street_food", "locality": "Manek Chowk", "landmark": "Clock Tower", "lat": 23.0258, "lng": 72.5873},
    {"name": "Swati's Dabeli Stand", "category": "street_food", "locality": "Law Garden", "landmark": "Near Law Garden Market", "lat": 23.0201, "lng": 72.5580},
    {"name": "Gopi Dining Hall", "famous_for": "Gujarati unlimited thali", "category": "eatery", "locality": "Ellisbridge", "landmark": "Opposite Town Hall", "lat": 23.0190, "lng": 72.5665},
    {"name": "Bhagat Tea Post", "category": "street_food", "locality": "Navrangpura", "landmark": "Near Gujarat College", "lat": 23.0330, "lng": 72.5620},
    {"name": "Satellite Sandwich House", "category": "street_food", "locality": "Satellite", "landmark": "Near Jodhpur Cross Road", "lat": 23.0270, "lng": 72.5150},
    {"name": "Vastrapur Momos Corner", "category": "street_food", "locality": "Vastrapur", "landmark": "Near Vastrapur Lake", "lat": 23.0395, "lng": 72.5280},
    {"name": "Amul Cold Drinks Cabin", "category": "street_food", "locality": "Navrangpura", "landmark": "Near Times of India Press", "lat": 23.0345, "lng": 72.5605},
]

REVIEWERS = ["Aarav", "Priya", "Kunal", "Meera", "Devansh", "Riya", "Sahil", "Ananya"]

# Demo vendor accounts, each claiming one of the listings above by index into
# SAMPLE_LISTINGS. Fixed phone numbers (not random) so they're easy to type
# in during a live demo. One lands at photo_verified, one at
# registered_business, so both trust tiers are visible without anyone having
# to run the live geolocation onboarding flow mid-demo.
VENDOR_CLAIMS = [
    {
        "listing_index": 0,  # Raju Vada Pav
        "phone_number": "+919990000001",
        "owner_name": "Raju",
        "description": "Family-run vada pav stall, serving CG Road for over 10 years. Fresh batches fried every 20 minutes.",
        "gst_number": None,  # -> photo_verified tier
    },
    {
        "listing_index": 3,  # Gopi Dining Hall
        "phone_number": "+919990000002",
        "owner_name": "Gopi",
        "description": "Unlimited thali dining hall, family-owned since 1998. Gujarati and Punjabi thalis available.",
        "gst_number": "24GOPID1234H1Z9",  # -> registered_business tier
    },
]

# (star_rating, taste, value, hygiene, crowd, text, verified, helpful_count, days_ago)
REVIEW_TEMPLATES = [
    (5, 5, 5, 4, 3, "Crispy outside, soft inside. Honestly one of the best I've had around here.", True, 28, 2),
    (4, 4, 5, 4, 4, "Great value for money, portions are generous. Goes a bit heavy on the chutney though.", True, 14, 5),
    (5, 5, 4, 5, 2, "Go before 8pm because the queue gets long, but it's worth the wait every time.", True, 31, 1),
    (3, 3, 4, 3, 5, "Decent but overhyped for the wait. Might just be an off day though.", False, 4, 9),
    (5, 5, 5, 5, 4, "This is my go-to spot when I'm craving something quick after work.", True, 19, 3),
    (4, 4, 3, 4, 3, "Solid choice, nothing fancy but consistently good.", False, 7, 12),
    (2, 2, 3, 2, 4, "Wasn't hygienic the day I visited, might have been unlucky though.", True, 9, 20),
    (5, 5, 5, 4, 2, "Hidden gem, barely anyone knows about this place yet.", True, 11, 6),
    (4, 5, 4, 4, 5, "Massive portions for the price, come hungry.", True, 22, 4),
    (3, 4, 3, 3, 3, "Average experience, wouldn't go out of my way for it.", False, 2, 15),
]


def run():
    init_db()
    with Session(engine) as session:
        users = []
        for name in REVIEWERS:
            phone = f"+9198{random.randint(10000000, 99999999)}"
            user = User(phone_number=phone, name=name)
            session.add(user)
            session.commit()
            session.refresh(user)
            users.append(user)

        seeded_listings = []

        for data in SAMPLE_LISTINGS:
            listing = Listing(**data, is_seeded=True)
            session.add(listing)
            session.commit()
            session.refresh(listing)
            seeded_listings.append(listing)

            sample_menus = {
                "Raju Vada Pav": [("Classic Vada Pav", 35, "Spiced potato fritter in a soft pav"), ("Cheese Vada Pav", 50, "Vada pav topped with melted cheese"), ("Masala Chai", 15, "Freshly brewed Indian tea")],
                "Manek Chowk Chaat Corner": [("Sev Puri", 60, "Crisp puris, chutneys and sev"), ("Pav Bhaji", 100, "Buttery pav with spicy mashed vegetables"), ("Dahi Puri", 70, "Crunchy puris with yogurt and chutneys")],
                "Swati's Dabeli Stand": [("Kutchi Dabeli", 30, "Sweet-spicy potato filling, peanuts and sev"), ("Cheese Dabeli", 45, "Dabeli finished with cheese")],
                "Gopi Dining Hall": [("Gujarati Thali", 180, "Seasonal sabzi, dal, roti, rice and accompaniments"), ("Punjabi Thali", 220, "North Indian curry, dal, roti and rice")],
            }
            for item_name, price, item_description in sample_menus.get(listing.name, []):
                session.add(MenuItem(listing_id=listing.id, name=item_name, price=price, description=item_description))
            session.commit()

            n_reviews = random.randint(2, 4)
            chosen_templates = random.sample(REVIEW_TEMPLATES, n_reviews)
            chosen_users = random.sample(users, n_reviews)

            for user, tmpl in zip(chosen_users, chosen_templates):
                star, taste, value, hygiene, crowd, text, verified, helpful, days_ago = tmpl
                review = Review(
                    listing_id=listing.id,
                    user_id=user.id,
                    star_rating=star,
                    tag_taste=taste,
                    tag_value=value,
                    tag_hygiene=hygiene,
                    tag_crowd=crowd,
                    text=text,
                    is_verified_visit=verified,
                    helpful_count=helpful,
                    created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
                )
                session.add(review)
                user.review_count += 1
                session.add(user)
            session.commit()

            _recompute_listing_rating(session, listing)
            session.commit()

        # Claim a couple of listings on behalf of demo vendor accounts so the
        # vendor dashboard has something real to show without a live
        # onboarding run during the demo.
        for claim in VENDOR_CLAIMS:
            vendor = User(
                phone_number=claim["phone_number"],
                name=claim["owner_name"],
                is_vendor=True,
            )
            session.add(vendor)
            session.commit()
            session.refresh(vendor)

            listing = seeded_listings[claim["listing_index"]]
            listing.claimed_by_user_id = vendor.id
            listing.description = claim["description"]
            listing.photo_url = "/uploads/demo-business-photo.jpg"
            listing.gst_number = claim["gst_number"]
            listing.verification_tier = _compute_verification_tier(
                has_photo=True, has_gst=bool(claim["gst_number"])
            )
            session.add(listing)
            session.commit()

        print(f"Seeded {len(SAMPLE_LISTINGS)} listings and {len(users)} reviewers.")
        print("Demo vendor accounts (log in as Vendor with these numbers):")
        for claim in VENDOR_CLAIMS:
            listing = seeded_listings[claim["listing_index"]]
            print(f"  {claim['phone_number']} -> owns '{listing.name}'")


if __name__ == "__main__":
    run()
