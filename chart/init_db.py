import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from database import engine, SessionLocal, Base
import models
import crud

def ensure_postgres_database():
    user = os.getenv("USER", "vikashkumarbharti")
    db_name = "map_3d_db"
    
    print(f"Connecting to PostgreSQL as user '{user}'...")
    conn = psycopg2.connect(dbname="postgres", user=user, host="localhost", port=5432)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}';")
    exists = cursor.fetchone()

    if not exists:
        print(f"Creating database '{db_name}'...")
        cursor.execute(f"CREATE DATABASE {db_name};")
        print(f"✅ Database '{db_name}' created successfully!")
    else:
        print(f"Database '{db_name}' already exists.")

    cursor.close()
    conn.close()

def setup_tables_and_seed():
    print("Creating tables via SQLAlchemy...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created!")

    db = SessionLocal()
    try:
        count = db.query(models.Marker).count()
        if count == 0:
            print("Seeding initial Gurgaon and London landmarks...")
            crud.seed_initial_data(db)
            print("✅ Seeded initial landmarks into PostgreSQL!")
        else:
            print(f"Database already has {count} markers.")
    finally:
        db.close()

if __name__ == "__main__":
    ensure_postgres_database()
    setup_tables_and_seed()
    print("🚀 Database initialization complete!")
