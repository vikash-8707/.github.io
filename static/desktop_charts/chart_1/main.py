import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, Base
import models
import schemas
import crud

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dynamic 3D Map API",
    description="Backend API powering interactive 3D vector marker maps using PostgreSQL.",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

@app.get("/api/markers", response_model=List[schemas.MarkerResponse], summary="Get all markers")
def read_markers(city: str = None, db: Session = Depends(get_db)):
    """Fetch markers from PostgreSQL, optionally filtered by city (e.g. 'gurgaon', 'london', 'all')."""
    return crud.get_markers(db, city=city)

@app.post("/api/markers", response_model=schemas.MarkerResponse, status_code=status.HTTP_201_CREATED, summary="Create a marker")
def add_marker(marker: schemas.MarkerCreate, db: Session = Depends(get_db)):
    """Save a new marker to PostgreSQL."""
    return crud.create_marker(db, marker)

@app.get("/api/markers/{marker_id}", response_model=schemas.MarkerResponse, summary="Get single marker")
def read_marker(marker_id: int, db: Session = Depends(get_db)):
    """Fetch a single marker by ID."""
    marker = crud.get_marker(db, marker_id)
    if not marker:
        raise HTTPException(status_code=404, detail="Marker not found")
    return marker

@app.put("/api/markers/{marker_id}", response_model=schemas.MarkerResponse, summary="Update marker")
def edit_marker(marker_id: int, marker_update: schemas.MarkerUpdate, db: Session = Depends(get_db)):
    """Update title, coordinates, or description of a marker in PostgreSQL."""
    updated = crud.update_marker(db, marker_id, marker_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Marker not found")
    return updated

@app.delete("/api/markers/{marker_id}", summary="Delete marker")
def remove_marker(marker_id: int, db: Session = Depends(get_db)):
    """Delete a marker from PostgreSQL."""
    deleted = crud.delete_marker(db, marker_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Marker not found")
    return {"message": f"Marker {marker_id} successfully deleted", "id": marker_id}

@app.post("/api/markers/reset", summary="Reset to default landmarks")
def reset_landmarks(db: Session = Depends(get_db)):
    """Delete all markers and re-seed default London landmarks."""
    db.query(models.Marker).delete()
    db.commit()
    seeded = crud.seed_initial_data(db)
    return {"message": f"Reset complete. {len(seeded)} landmarks restored."}

@app.get("/")
def serve_index():
    """Serve the 3D map frontend."""
    index_file = os.path.join(CURRENT_DIR, "index.html")
    return FileResponse(index_file)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 Starting FastAPI server on http://localhost:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
