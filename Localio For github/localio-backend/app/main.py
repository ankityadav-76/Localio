from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import listings, reviews, auth, users, vendor

app = FastAPI(title="Localio API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(listings.router)
app.include_router(reviews.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(vendor.router)


@app.get("/health")
def health():
    return {"status": "ok"}
