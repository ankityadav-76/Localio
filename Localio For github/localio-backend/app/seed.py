"""
Seeds the DB with realistic listings, reviewers, and reviews for one
micro-area so the discovery sections (trending, hidden gems, highly rated,
recently reviewed) have something real to compute from. Replace with your
actual manually-collected 20-50 listings for the chosen V1 micro-area before
this goes anywhere near real users.

Run with: python -m app.seed
"""
import random
from datetime import datetime, timedelta
from sqlmodel import Session
from .database import engine, init_db
from .models import Listing, User, Review
from .routers.reviews import _recompute_listing_rating

SAMPLE_LISTINGS = [
    {"name": "Raju Vada Pav", "category": "street_food", "locality": "CG Road", "landmark": "Near Fun Republic", "lat": 23.0225, "lng": 72.5714},
    {"name": "Manek Chowk Chaat Corner", "category": "street_food", "locality": "Manek Chowk", "landmark": "Clock Tower", "lat": 23.0258, "lng": 72.5873},
    {"name": "Swati's Dabeli Stand", "category": "street_food", "locality": "Law Garden", "landmark": "Near Law Garden Market", "lat": 23.0201, "lng": 72.5580},
    {"name": "Gopi Dining Hall", "category": "eatery", "locality": "Ellisbridge", "landmark": "Opposite Town Hall", "lat": 23.0190, "lng": 72.5665},
    {"name": "Bhagat Tea Post", "category": "street_food", "locality": "Navrangpura", "landmark": "Near Gujarat College", "lat": 23.0330, "lng": 72.5620},
    {"name": "Satellite Sandwich House", "category": "street_food", "locality": "Satellite", "landmark": "Near Jodhpur Cross Road", "lat": 23.0270, "lng": 72.5150},
    {"name": "Vastrapur Momos Corner", "category": "street_food", "locality": "Vastrapur", "landmark": "Near Vastrapur Lake", "lat": 23.0395, "lng": 72.5280},
    {"name": "Amul Cold Drinks Cabin", "category": "street_food", "locality": "Navrangpura", "landmark": "Near Times of India Press", "lat": 23.0345, "lng": 72.5605},
]

REVIEWERS = ["Aarav", "Priya", "Kunal", "Meera", "Devansh", "Riya", "Sahil", "Ananya"]

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

        for data in SAMPLE_LISTINGS:
            listing = Listing(**data, is_seeded=True)
            session.add(listing)
            session.commit()
            session.refresh(listing)

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
                    created_at=datetime.utcnow() - timedelta(days=days_ago),
                )
                session.add(review)
                user.review_count += 1
                session.add(user)
            session.commit()

            _recompute_listing_rating(session, listing)
            session.commit()

        print(f"Seeded {len(SAMPLE_LISTINGS)} listings and {len(users)} reviewers.")


if __name__ == "__main__":
    run()
