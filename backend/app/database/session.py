from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.entities import Base

# Database engine configuration using standard library sqlite3 or sync postgres
db_url = settings.DATABASE_URL

if "sqlite+aiosqlite" in db_url:
    db_url = db_url.replace("sqlite+aiosqlite", "sqlite")
elif "postgresql+asyncpg" in db_url:
    db_url = db_url.replace("postgresql+asyncpg", "postgresql")

engine = create_engine(
    db_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

def init_db():
    Base.metadata.create_all(bind=engine)
    if "sqlite" in db_url:
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(synthesis_results)")).fetchall()
                cols = [r[1] for r in res]
                if "verdict" not in cols:
                    conn.execute(text("ALTER TABLE synthesis_results ADD COLUMN verdict VARCHAR DEFAULT 'PARTIALLY_SUPPORTED'"))
                if "why_this_result" not in cols:
                    conn.execute(text("ALTER TABLE synthesis_results ADD COLUMN why_this_result JSON"))
                conn.commit()
            except Exception as e:
                print(f"[init_db] SQLite migration notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

