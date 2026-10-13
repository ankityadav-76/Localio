# Localio backend (prototype)

FastAPI + SQLModel + SQLite (swap-in Postgres/PostGIS later via `DATABASE_URL`).

## Run locally

From the repository root, use PowerShell:

```powershell
cd .\localio-backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```

On macOS/Linux, create and activate a virtual environment with
`python -m venv .venv` and `source .venv/bin/activate`, then install the
requirements, seed with `python -m app.seed`, and run
`uvicorn app.main:app --reload`.

The seed command adds demo listings and accounts to the configured database.
The SQLite file is local development data and is intentionally not tracked by
Git.

For the end-to-end smoke test, start the server in one terminal and run
`python smoke_test.py` from this directory in another terminal. It writes
sample data to the configured database.

API docs (Swagger UI): http://127.0.0.1:8000/docs

For Razorpay test checkout, create Test API keys in the Razorpay dashboard and
set them only in the backend process environment (never in the app's `EXPO_PUBLIC_*`
variables):

```powershell
$env:RAZORPAY_KEY_ID = "rzp_test_your_key_id"
$env:RAZORPAY_KEY_SECRET = "your_test_key_secret"
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
```

Use Live API keys only after testing. Do not commit either key or send the
secret from the mobile app. The backend creates Razorpay orders, verifies
checkout signatures, and captures authorized payments.

## Demo accounts (for the hackathon pitch)

The seed script claims two listings on behalf of demo vendor accounts, so the
vendor dashboard shows real ratings/reviews without running the live
geolocation onboarding flow mid-demo:

| Phone number | Owns | Verification tier |
|---|---|---|
| `+919990000001` | Raju Vada Pav | Photo verified |
| `+919990000002` | Gopi Dining Hall | Registered business (has a GST number) |

To demo the vendor side: on the frontend login screen, choose **Vendor**,
enter one of the numbers above, tap "Send code," and use the `dev_code`
shown on screen (no real SMS is sent in this prototype). You'll land
straight on that vendor's dashboard.

To demo the live claim flow instead (new business, not pre-seeded), log in
as Vendor with any other phone number — you'll be taken to onboarding, which
needs real device location access to complete the location-verification step.

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
- [x] Food orders: persisted dine-in/takeaway orders with Razorpay payment verification and vendor order lookup

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
| POST | `/users/contact-matches` | compare consented contact phone numbers with reviewer accounts; returns matching user IDs only |
| GET | `/users/{id}` | reviewer profile header (name, review count) |
| GET | `/users/{id}/reviews` | a reviewer's own review history |
| POST | `/vendor/listings` | one-time business claim/create (location + photo verification, optional GST) |
| GET | `/vendor/listings/mine?user_id=` | listings claimed by a vendor account |
| GET | `/vendor/listings/{id}/dashboard?user_id=` | read-only rating/helpful-vote totals + recent reviews for the owner |
| POST | `/orders` | create a dine-in or takeaway order and Razorpay payment order |
| POST | `/orders/{id}/payment/verify` | verify the Razorpay signature, validate/capture payment, and mark the order paid |
| GET | `/vendor/listings/{id}/orders?user_id=` | list paid orders for the listing owner |
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
- **Payments and order fulfilment**: Razorpay is used for online payment, but
  vendor notifications and refunds are not connected. Paid orders can be
  retrieved from the vendor orders endpoint. Local sample-menu prices are
  provisional and are blocked from online checkout until the vendor adds
  confirmed menu items.
- **Government ID verification**: deliberately not built. Raw Aadhaar numbers
  can only be collected/verified by UIDAI-licensed entities (AUAs/KUAs) under
  the Aadhaar Act, 2016 — a hackathon prototype storing them is a legal
  liability, not a feature. If a stronger ID tier is wanted later, DigiLocker
  is the legitimate route (government-backed, doesn't require handling raw
  Aadhaar numbers). Current tiers stop at photo+location verification and
  optional GST.
