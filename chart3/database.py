"""
Database Module for Chart3.
Provides schema inspection, table discovery, and querying from PostgreSQL.
"""

import os
from typing import List, Dict, Any, Optional
import pandas as pd
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

DEFAULT_POSTGRES_URI = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://vikashkumarbharti@localhost:5432/auth_db"
)

_engine: Optional[Engine] = None


def get_engine() -> Engine:
    """Get active SQLAlchemy engine."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            DEFAULT_POSTGRES_URI,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10
        )
    return _engine


def get_postgres_schema() -> Dict[str, Any]:
    """Inspects PostgreSQL database and returns available tables and their numeric columns."""
    try:
        eng = get_engine()
        insp = inspect(eng)
        tables = insp.get_table_names()

        tables_meta = []
        for tbl in tables:
            cols = insp.get_columns(tbl)
            numeric_cols = []
            all_cols = []
            for c in cols:
                col_name = c["name"]
                all_cols.append(col_name)
                col_type = str(c["type"]).lower()
                if any(t in col_type for t in ["int", "float", "numeric", "double", "real"]):
                    numeric_cols.append(col_name)

            # Check row count
            try:
                with eng.connect() as conn:
                    cnt = conn.execute(text(f'SELECT COUNT(*) FROM "{tbl}"')).scalar()
            except Exception:
                cnt = 0

            tables_meta.append({
                "table_name": tbl,
                "row_count": int(cnt) if cnt else 0,
                "numeric_columns": numeric_cols if numeric_cols else all_cols,
                "all_columns": all_cols
            })

        db_name = DEFAULT_POSTGRES_URI.split("/")[-1].split("?")[0]
        return {
            "status": "connected",
            "database": db_name,
            "tables": tables_meta,
            "default_table": "cars_data" if "cars_data" in tables else (tables[0] if tables else "")
        }

    except Exception as err:
        return {
            "status": "error",
            "database": "unknown",
            "error": str(err),
            "tables": [
                {
                    "table_name": "cars_data",
                    "row_count": 406,
                    "numeric_columns": ["Horsepower", "Miles_per_Gallon", "Weight_in_lbs", "Acceleration", "Displacement"]
                }
            ]
        }
