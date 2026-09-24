import os
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

POSTGRES_DEFAULT_URI = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://vikashkumarbharti@localhost:5432/auth_db"
)

active_engine: Optional[Engine] = None
active_uri: str = POSTGRES_DEFAULT_URI


def get_engine() -> Engine:
    """Returns the current active SQLAlchemy engine."""
    global active_engine, active_uri
    if active_engine is None:
        init_database()
    return active_engine


def set_database_uri(uri: str) -> Tuple[bool, str]:
    """
    Switches the active database URI if connection succeeds.
    Returns (success, message).
    """
    global active_engine, active_uri
    if "sqlite" in uri.lower():
        return False, "SQLite is not supported. Use a PostgreSQL URI (postgresql+psycopg2://user:pass@host:port/dbname)."
    try:
        new_engine = create_engine(uri)
        with new_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        active_engine = new_engine
        active_uri = uri
        db_name = uri.split("/")[-1].split("?")[0]
        return True, f"Successfully connected to PostgreSQL database '{db_name}'"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"


def init_database():
    """Connects to PostgreSQL. Raises if the database is unavailable."""
    global active_engine, active_uri
    try:
        pg_engine = create_engine(POSTGRES_DEFAULT_URI)
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        raise RuntimeError(
            f"PostgreSQL connection failed ({POSTGRES_DEFAULT_URI}). "
            f"Set DATABASE_URL or start Postgres. Original error: {e}"
        ) from e

    active_engine = pg_engine
    active_uri = POSTGRES_DEFAULT_URI
    print("✓ Connected to PostgreSQL database at:", POSTGRES_DEFAULT_URI)

    inspector = inspect(active_engine)
    if not inspector.get_table_names():
        seed_sample_data(active_engine)


def seed_sample_data(engine: Engine):
    """Populates an empty PostgreSQL database with sample 3D datasets."""
    # 1. Sensor Measurements
    n_points = 300
    np.random.seed(42)
    sensor_x = np.random.uniform(-50, 50, n_points)
    sensor_y = np.random.uniform(-50, 50, n_points)
    sensor_z = (sensor_x**2 + sensor_y**2) / 40.0 + np.random.normal(0, 5, n_points)
    pressure = 101.3 + sensor_z * 0.4 + np.random.normal(0, 1.5, n_points)

    df_sensors = pd.DataFrame({
        "id": list(range(1, n_points + 1)),
        "device_id": [f"DEV-{1000 + i}" for i in range(n_points)],
        "pos_x": np.round(sensor_x, 2),
        "pos_y": np.round(sensor_y, 2),
        "altitude_z": np.round(sensor_z, 2),
        "pressure_kpa": np.round(pressure, 2),
        "status": np.random.choice(["Optimal", "Warning", "Normal"], size=n_points, p=[0.7, 0.1, 0.2])
    })
    df_sensors.to_sql("sensor_measurements", engine, if_exists="replace", index=False)


def get_db_info() -> Dict[str, Any]:
    """Returns metadata about the active database connection."""
    eng = get_engine()
    inspector = inspect(eng)
    tables = inspector.get_table_names()
    dialect = eng.dialect.name
    
    # Safe URI display
    safe_uri = active_uri
    if "@" in safe_uri:
        prefix, rest = safe_uri.split("://", 1)
        _, host_db = rest.split("@", 1)
        safe_uri = f"{prefix}://***:***@{host_db}"

    db_name = active_uri.split("/")[-1].split("?")[0]

    return {
        "uri": safe_uri,
        "raw_uri": active_uri,
        "dialect": dialect,
        "db_name": db_name,
        "table_count": len(tables),
        "tables": tables,
        "is_postgres": "postgres" in dialect.lower()
    }


def get_tables_metadata() -> List[Dict[str, Any]]:
    """Returns a list of tables with column names, types, and sample row count."""
    eng = get_engine()
    inspector = inspect(eng)
    table_names = inspector.get_table_names()
    results = []

    with eng.connect() as conn:
        for tname in table_names:
            try:
                columns = inspector.get_columns(tname)
            except Exception:
                continue

            cols_info = []
            numeric_cols = []
            text_cols = []
            for col in columns:
                cname = col["name"]
                ctype = str(col["type"]).lower()
                is_numeric = any(t in ctype for t in ["int", "float", "double", "real", "num", "dec", "precision"])
                cols_info.append({
                    "name": cname,
                    "type": str(col["type"]),
                    "is_numeric": is_numeric
                })
                if is_numeric:
                    numeric_cols.append(cname)
                else:
                    text_cols.append(cname)

            try:
                row_count = conn.execute(text(f'SELECT COUNT(*) FROM "{tname}"')).scalar()
            except Exception:
                row_count = 0

            results.append({
                "table_name": tname,
                "row_count": row_count,
                "columns": cols_info,
                "numeric_columns": numeric_cols,
                "text_columns": text_cols
            })

    return results


def query_table_data(
    table_name: str,
    x_col: str,
    y_col: str,
    z_col: str,
    color_col: Optional[str] = None,
    limit: int = 5000
) -> Dict[str, Any]:
    """
    Queries records from PostgreSQL table and returns structured coordinate data
    along with full row metadata for rich hover tooltips.
    """
    eng = get_engine()
    inspector = inspect(eng)
    valid_tables = inspector.get_table_names()
    if table_name not in valid_tables:
        raise ValueError(f"Table '{table_name}' does not exist in database.")

    # Fetch all columns to provide rich hover tooltips
    sql = f'SELECT * FROM "{table_name}" WHERE "{x_col}" IS NOT NULL AND "{y_col}" IS NOT NULL AND "{z_col}" IS NOT NULL LIMIT {limit}'

    df = pd.read_sql_query(sql, eng)

    color_values = None
    if color_col and color_col in df.columns:
        color_values = df[color_col].tolist()
    else:
        color_values = df[z_col].tolist()

    # Create descriptive hover metadata dictionaries
    metadata_list = df.to_dict(orient="records")

    return {
        "x": df[x_col].tolist(),
        "y": df[y_col].tolist(),
        "z": df[z_col].tolist(),
        "color": color_values,
        "metadata": metadata_list,
        "row_count": len(df),
        "x_label": x_col,
        "y_label": y_col,
        "z_label": z_col,
        "color_label": color_col or z_col
    }


def execute_custom_query(sql_query: str) -> Dict[str, Any]:
    """
    Executes a custom SELECT query on PostgreSQL and returns dataframe records
    along with identified numeric columns.
    """
    sql_trimmed = sql_query.strip()
    if not sql_trimmed.upper().startswith("SELECT"):
        raise ValueError("Only SELECT queries are permitted.")

    eng = get_engine()
    df = pd.read_sql_query(sql_trimmed, eng)

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]

    return {
        "columns": list(df.columns),
        "numeric_columns": numeric_cols,
        "row_count": len(df),
        "metadata": df.to_dict(orient="records"),
        "full_records": df.to_dict(orient="list")
    }
