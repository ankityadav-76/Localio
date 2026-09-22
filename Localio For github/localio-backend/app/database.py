import os
from sqlmodel import SQLModel, create_engine, Session

# Prototype default: SQLite file. Swap to Postgres+PostGIS in prod by setting
# DATABASE_URL, e.g. postgresql://user:pass@host/db — the geo distance helper
# in services/geo.py does the haversine math in Python so it works identically
# on SQLite now and can be swapped for a real PostGIS ST_DWithin query later
# without touching the API layer.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./localio.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
