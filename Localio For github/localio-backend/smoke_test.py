import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- health ---")
r = client.get("/health")
print(r.status_code, r.json())

print("\n--- search near CG Road, 2km, sorted by distance ---")
r = client.get("/listings", params={"lat": 23.0225, "lng": 72.5714, "radius_m": 2000, "sort": "distance"})
print(r.status_code)
print(json.dumps(r.json(), indent=2)[:1200])

print("\n--- otp send ---")
r = client.post("/auth/otp/send", json={"phone_number": "+919876543210"})
print(r.status_code, r.json())
code = r.json()["dev_code"]

print("\n--- otp verify ---")
r = client.post("/auth/otp/verify", json={"phone_number": "+919876543210", "code": code})
print(r.status_code, r.json())
user_id = r.json()["user_id"]

print("\n--- get first listing id ---")
r = client.get("/listings", params={"locality": "CG Road"})
listing = r.json()[0]
print(listing)

print("\n--- submit a review (with geolocation matching listing -> verified) ---")
r = client.post(
    "/reviews",
    data={
        "listing_id": listing["id"],
        "user_id": user_id,
        "star_rating": 5,
        "tag_taste": 5,
        "text": "Genuinely the best vada pav on this stretch.",
        "reviewer_lat": listing["lat"],
        "reviewer_lng": listing["lng"],
    },
)
print(r.status_code, r.json())
review = r.json()

print("\n--- listing after new review (rating should update) ---")
r = client.get(f"/listings/{listing['id']}")
print(r.status_code, r.json())

print("\n--- vote review helpful ---")
r = client.post(f"/reviews/{review['id']}/vote", json={"user_id": user_id, "is_helpful": True})
print(r.status_code, r.json())

print("\n--- list reviews sorted by helpful ---")
r = client.get(f"/listings/{listing['id']}/reviews", params={"sort": "helpful"})
print(r.status_code, json.dumps(r.json(), indent=2))
