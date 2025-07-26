import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from google.cloud.sql.connector import Connector, IPTypes
# Read env vars
INSTANCE_CONN = os.getenv("INSTANCE_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
PUBLIC_IP = os.getenv("PUBLIC_IP")

# Create SQLAlchemy engine
def get_engine():
    engine = create_engine(
        f"postgresql+pg8000://{DB_USER}:{DB_PASS}@{PUBLIC_IP}:5432/{DB_NAME}",
        # connect_args={"sslmode": "require"},
    )
    return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Manual usage of DB session (not using Depends)
def list_items():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT * FROM lesson_plans")).fetchall()
        print([{"id": r[0], "date": r[1]} for r in result])
    finally:
        db.close()

# Example call
if __name__ == "__main__":
    list_items()