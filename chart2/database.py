"""
Database and Data Provider Module for Chart2.
Powered by PostgreSQL (auth_db) with SQLAlchemy.
Provides dataset querying, filtering, column inspection, and summary statistics.
"""

import os
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from altair.datasets import data

POSTGRES_DEFAULT_URI = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://vikashkumarbharti@localhost:5432/auth_db"
)

_engine: Optional[Engine] = None
_cached_df: Optional[pd.DataFrame] = None


def get_engine() -> Engine:
    """Returns the active SQLAlchemy PostgreSQL engine."""
    global _engine
    if _engine is None:
        init_database()
    return _engine


def init_database():
    """Initializes PostgreSQL connection and verifies/seeds cars_data table."""
    global _engine
    try:
        _engine = create_engine(POSTGRES_DEFAULT_URI)
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        raise RuntimeError(
            f"PostgreSQL connection failed at ({POSTGRES_DEFAULT_URI}). "
            f"Please ensure PostgreSQL is running. Error: {e}"
        ) from e

    inspector = inspect(_engine)
    existing_tables = inspector.get_table_names()
    
    # If cars_data table does not exist in PostgreSQL, seed it from altair datasets
    if "cars_data" not in existing_tables:
        print("🌱 Seeding 'cars_data' table into PostgreSQL...")
        raw_df = data.cars().copy()
        raw_df["Year_Int"] = pd.to_datetime(raw_df["Year"]).dt.year
        raw_df = raw_df.dropna(subset=["Origin"])
        raw_df.to_sql("cars_data", _engine, if_exists="replace", index=False)
        print("✓ Successfully seeded cars_data into PostgreSQL.")


def get_postgres_db_status() -> Dict[str, Any]:
    """Returns the live connection status and metadata for PostgreSQL."""
    try:
        eng = get_engine()
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
            count_res = conn.execute(text("SELECT COUNT(*) FROM cars_data")).scalar()
            tables = inspect(eng).get_table_names()
            db_name = POSTGRES_DEFAULT_URI.split("/")[-1].split("?")[0]
            return {
                "status": "connected",
                "database": db_name,
                "engine": "PostgreSQL",
                "tables": tables,
                "cars_count": int(count_res) if count_res else 0,
                "uri_safe": f"postgresql://localhost:5432/{db_name}"
            }
    except Exception as e:
        return {
            "status": "error",
            "database": "unknown",
            "engine": "PostgreSQL",
            "error": str(e)
        }


def get_raw_cars_df() -> pd.DataFrame:
    """Query cars dataset directly from PostgreSQL table 'cars_data'."""
    global _cached_df
    if _cached_df is None:
        eng = get_engine()
        query = 'SELECT * FROM cars_data'
        df = pd.read_sql(query, eng)
        if "Year_Int" not in df.columns and "Year" in df.columns:
            df["Year_Int"] = pd.to_datetime(df["Year"]).dt.year
        df = df.dropna(subset=["Origin"])
        _cached_df = df
    return _cached_df.copy()


def get_cars_list_from_db() -> List[Dict[str, Any]]:
    """Return list of distinct cars with specs from PostgreSQL for the 3D model viewer."""
    df = get_raw_cars_df()
    cols = ["Name", "Miles_per_Gallon", "Horsepower", "Weight_in_lbs", "Acceleration", "Cylinders", "Origin", "Year_Int"]
    present_cols = [c for c in cols if c in df.columns]
    
    # Sort by Horsepower descending and drop duplicates by Name
    clean_cars = df.dropna(subset=["Name"]).drop_duplicates(subset=["Name"]).sort_values(by="Horsepower", ascending=False)
    
    records = []
    for _, row in clean_cars[present_cols].iterrows():
        rec = {}
        for c in present_cols:
            val = row[c]
            rec[c] = None if pd.isna(val) else (int(val) if isinstance(val, (np.integer, int)) else (round(float(val), 2) if isinstance(val, (np.floating, float)) else str(val)))
        records.append(rec)
    return records


def get_dataset_schema() -> Dict[str, Any]:
    """Return available metrics, categorical grouping options, and ranges from PostgreSQL."""
    df = get_raw_cars_df()
    
    numeric_columns = [
        {"id": "Miles_per_Gallon", "label": "Miles per Gallon (MPG)", "min": float(df["Miles_per_Gallon"].min()), "max": float(df["Miles_per_Gallon"].max())},
        {"id": "Horsepower", "label": "Horsepower (HP)", "min": float(df["Horsepower"].min()), "max": float(df["Horsepower"].max())},
        {"id": "Weight_in_lbs", "label": "Weight (lbs)", "min": float(df["Weight_in_lbs"].min()), "max": float(df["Weight_in_lbs"].max())},
        {"id": "Displacement", "label": "Displacement (cu. in.)", "min": float(df["Displacement"].min()), "max": float(df["Displacement"].max())},
        {"id": "Acceleration", "label": "Acceleration (0-60 mph sec)", "min": float(df["Acceleration"].min()), "max": float(df["Acceleration"].max())},
        {"id": "Cylinders", "label": "Cylinders", "min": float(df["Cylinders"].min()), "max": float(df["Cylinders"].max())},
    ]

    categorical_columns = [
        {"id": "Origin", "label": "Country of Origin", "options": sorted(df["Origin"].dropna().unique().tolist())},
        {"id": "Cylinders", "label": "Engine Cylinders", "options": [str(c) for c in sorted(df["Cylinders"].dropna().unique().tolist())]},
        {"id": "Year_Int", "label": "Production Year", "options": [str(y) for y in sorted(df["Year_Int"].dropna().unique().tolist())]}
    ]

    return {
        "dataset_name": "cars_data",
        "database": "PostgreSQL (auth_db)",
        "total_records": len(df),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "all_origins": sorted(df["Origin"].dropna().unique().tolist()),
        "year_range": [int(df["Year_Int"].min()), int(df["Year_Int"].max())],
        "default_metric": "Miles_per_Gallon",
        "default_groupby": "Origin"
    }


def filter_cars_data(
    metric: str = "Miles_per_Gallon",
    groupby: str = "Origin",
    origins: Optional[List[str]] = None,
    cylinders: Optional[List[int]] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    min_value: Optional[float] = None,
    max_value: Optional[float] = None,
) -> pd.DataFrame:
    """Filter the PostgreSQL cars dataset according to query criteria."""
    df = get_raw_cars_df()

    if metric not in df.columns:
        metric = "Miles_per_Gallon"

    if origins:
        df = df[df["Origin"].isin(origins)]

    if cylinders:
        df = df[df["Cylinders"].isin(cylinders)]

    if min_year is not None:
        df = df[df["Year_Int"] >= min_year]
    if max_year is not None:
        df = df[df["Year_Int"] <= max_year]

    df = df.dropna(subset=[metric, groupby])
    if min_value is not None:
        df = df[df[metric] >= min_value]
    if max_value is not None:
        df = df[df[metric] <= max_value]

    return df


def calculate_group_statistics(df: pd.DataFrame, metric: str, groupby: str) -> List[Dict[str, Any]]:
    """Compute summary statistics per group for the selected metric."""
    if df.empty or metric not in df.columns or groupby not in df.columns:
        return []

    stats = []
    for group_name, group_data in df.groupby(groupby):
        values = group_data[metric].dropna().values
        if len(values) == 0:
            continue
        
        q25 = float(np.percentile(values, 25))
        q75 = float(np.percentile(values, 75))
        iqr = q75 - q25

        stats.append({
            "group": str(group_name),
            "count": int(len(values)),
            "mean": round(float(np.mean(values)), 2),
            "median": round(float(np.median(values)), 2),
            "std": round(float(np.std(values)), 2),
            "min": round(float(np.min(values)), 2),
            "max": round(float(np.max(values)), 2),
            "q25": round(q25, 2),
            "q75": round(q75, 2),
            "iqr": round(iqr, 2)
        })

    return stats
