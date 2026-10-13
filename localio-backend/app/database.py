import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect, text

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
    # Lightweight SQLite migration for databases created before the food feed.
    # create_all creates new tables, but does not add columns to existing tables.
    if DATABASE_URL.startswith("sqlite") and "listing" in inspect(engine).get_table_names():
        columns = {column["name"] for column in inspect(engine).get_columns("listing")}
        migrations = {
            "famous_for": "ALTER TABLE listing ADD COLUMN famous_for VARCHAR",
            "is_open": "ALTER TABLE listing ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT 1",
            "crowd_level": "ALTER TABLE listing ADD COLUMN crowd_level VARCHAR NOT NULL DEFAULT 'moderate'",
        }
        with engine.begin() as connection:
            for name, statement in migrations.items():
                if name not in columns:
                    connection.execute(text(statement))
    if DATABASE_URL.startswith("sqlite") and "food_order" in inspect(engine).get_table_names():
        columns = {column["name"] for column in inspect(engine).get_columns("food_order")}
        migrations = {
            "razorpay_order_id": "ALTER TABLE food_order ADD COLUMN razorpay_order_id VARCHAR",
            "razorpay_payment_id": "ALTER TABLE food_order ADD COLUMN razorpay_payment_id VARCHAR",
        }
        with engine.begin() as connection:
            for name, statement in migrations.items():
                if name not in columns:
                    connection.execute(text(statement))


def get_session():
    with Session(engine) as session:
        yield session
