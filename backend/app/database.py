import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Local dev: SQLite file, no setup required.
# Production (Render): DATABASE_URL env var points at a Neon Postgres
# instance instead — Render's free web services have an ephemeral
# filesystem, so a local SQLite file would get wiped on every
# restart/redeploy. Setting DATABASE_URL switches this over automatically;
# nothing else in the app needs to know which database it's talking to.
_database_url = os.getenv("DATABASE_URL")

if _database_url:
    # Some providers (Neon, Heroku-style) hand out "postgres://" URLs, but
    # SQLAlchemy 1.4+ requires the "postgresql://" scheme — swap it rather
    # than making every deploy target remember to do this themselves.
    if _database_url.startswith("postgres://"):
        _database_url = _database_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = _database_url
    connect_args = {}
else:
    # On Windows, os.path.join produces backslashes which SQLite URLs
    # reject, so we normalize to forward slashes.
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(BASE_DIR, "prospects.db").replace("\\", "/")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
