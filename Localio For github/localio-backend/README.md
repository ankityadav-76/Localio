# Localio backend (prototype)

FastAPI + SQLModel + SQLite (swap-in Postgres/PostGIS later via `DATABASE_URL`).

## Run it

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# seed sample listings for the demo micro-area (edit app/seed.py with your real 20-50)
python -m app.seed

# run the API
uvicorn app.main:app --reload
```

API docs (Swagger UI): http://127.0.0.1:8000/docs

## What's built (V1 backend, steps 1-4 of the plan)

- [x] Data layer: `User`, `Listing`, `Review`, `ReviewVote` models
- [x] Seed script for bootstrapping listings
- [x] Phone OTP auth (dev stub — see below)
- [x] Nearby/locality search with distance sorting
- [x] Listing detail + review-feed endpoints (sorted by helpful or recent)
- [x] Review submission with geolocation-based verified-visit badge
- [x] Helpful voting
- [x] Bayesian-adjusted rating, recomputed on every new review
- [x] Reviewer identity (name + review count) joined into review responses
- [x] Reviewer profile endpoints (`/users/{id}`, `/users/{id}/reviews`)
- [x] Seed data expanded to 8 listings, 8 named reviewers, human-sounding reviews
- [x] Vendor side: one-time business claim/create flow (`/vendor/listings`), location+photo verification tiers (unverified / photo_verified / registered_business via optional GST), read-only vendor dashboard (`/vendor/listings/{id}/dashboard`) — no reply/edit access to reviews, by design

## Endpoints

| Method | Path | What |
|---|---|---|
| GET | `/health` | liveness check |
| POST | `/listings` | create a listing (used by seed script / future self-claim flow) |
| GET | `/listings?lat=&lng=&radius_m=&locality=&sort=` | nearby/locality search |
| GET | `/listings/{id}` | listing detail |
| GET | `/listings/{id}/reviews?sort=helpful\|recent` | review feed for a listing |
| POST | `/reviews` (multipart form) | submit a review; sets verified-visit badge server-side |
| POST | `/reviews/{id}/vote` | mark a review helpful |
| GET | `/users/{id}` | reviewer profile header (name, review count) |
| GET | `/users/{id}/reviews` | a reviewer's own review history |
| POST | `/vendor/listings` | one-time business claim/create (location + photo verification, optional GST) |
| GET | `/vendor/listings/mine?user_id=` | listings claimed by a vendor account |
| GET | `/vendor/listings/{id}/dashboard?user_id=` | read-only rating/helpful-vote totals + recent reviews for the owner |
| POST | `/auth/otp/send` | send OTP (dev: returns `dev_code` directly instead of SMS) |
| POST | `/auth/otp/verify` | verify OTP, creates user on first login |

Full interactive testing: run the server and open `/docs`, or see `smoke_test.py`
for a scripted end-to-end run through every endpoint (search, OTP login,
verified review submission, rating recompute, helpful voting).

## Before this touches real users

- **Auth**: replace `app/routers/auth.py`'s in-memory OTP store with Firebase
  Auth (phone provider) or Twilio Verify, and return a real signed JWT instead
  of a bare user id.
- **Photo upload**: `photo_url` is currently a placeholder string — wire
  `POST /reviews` and `POST /vendor/listings` to actually upload to Cloudflare R2/S3 and store the real URL.
- **DB**: switch `DATABASE_URL` to Postgres and add PostGIS if search volume/
  area grows past what a Python haversine filter comfortably handles.
- **Auth on writes**: `user_id` is currently passed directly in request bodies
  since there's no JWT yet — once auth is real, pull `user_id` from the
  verified token instead of trusting the client.
- **Government ID verification**: deliberately not built. Raw Aadhaar numbers
  can only be collected/verified by UIDAI-licensed entities (AUAs/KUAs) under
  the Aadhaar Act, 2016 — a hackathon prototype storing them is a legal
  liability, not a feature. If a stronger ID tier is wanted later, DigiLocker
  is the legitimate route (government-backed, doesn't require handling raw
  Aadhaar numbers). Current tiers stop at photo+location verification and
  optional GST.
