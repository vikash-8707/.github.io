from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from models import Marker
from schemas import MarkerCreate, MarkerUpdate

def get_markers(db: Session, city: Optional[str] = None):
    query = db.query(Marker)
    if city and city.lower() != "all":
        query = query.filter(Marker.city == city.lower())
    return query.order_by(Marker.number.asc().nulls_last(), Marker.id.asc()).all()

def get_marker(db: Session, marker_id: int):
    return db.query(Marker).filter(Marker.id == marker_id).first()

def create_marker(db: Session, marker_in: MarkerCreate):
    target_city = (marker_in.city or "gurgaon").lower()
    
    # Auto-assign next number in this city
    if marker_in.number is None:
        max_num = db.query(func.max(Marker.number)).filter(Marker.city == target_city).scalar() or 0
        assigned_num = max_num + 1
    else:
        assigned_num = marker_in.number

    db_marker = Marker(
        title=marker_in.title,
        description=marker_in.description,
        latitude=marker_in.latitude,
        longitude=marker_in.longitude,
        number=assigned_num,
        category=marker_in.category or "Landmark",
        city=target_city
    )
    db.add(db_marker)
    db.commit()
    db.refresh(db_marker)
    return db_marker

def update_marker(db: Session, marker_id: int, marker_in: MarkerUpdate):
    db_marker = get_marker(db, marker_id)
    if not db_marker:
        return None
    
    update_data = marker_in.model_dump(exclude_unset=True)
    if "city" in update_data and update_data["city"]:
        update_data["city"] = update_data["city"].lower()

    for key, value in update_data.items():
        setattr(db_marker, key, value)
        
    db.commit()
    db.refresh(db_marker)
    return db_marker

def delete_marker(db: Session, marker_id: int):
    db_marker = get_marker(db, marker_id)
    if not db_marker:
        return None
    db.delete(db_marker)
    db.commit()
    return db_marker

def seed_initial_data(db: Session):
    """Seed landmarks for both Gurgaon (Gurugram) and London."""
    landmarks_to_seed = [
        # Gurgaon Landmarks
        {
            "number": 1,
            "title": "DLF CyberHub",
            "latitude": 28.4951,
            "longitude": 77.0894,
            "description": "Social, dining, and corporate hub at the center of DLF Cyber City.",
            "category": "Tech & Dining",
            "city": "gurgaon"
        },
        {
            "number": 2,
            "title": "DLF Gateway Tower",
            "latitude": 28.4990,
            "longitude": 77.0940,
            "description": "Famous ship-shaped glass skyscraper welcoming visitors to Cyber City.",
            "category": "Skyscraper",
            "city": "gurgaon"
        },
        {
            "number": 3,
            "title": "Ambience Mall",
            "latitude": 28.5042,
            "longitude": 77.0970,
            "description": "Massive premium retail, dining, and entertainment destination on NH-48.",
            "category": "Shopping",
            "city": "gurgaon"
        },
        {
            "number": 4,
            "title": "One Horizon Center",
            "latitude": 28.4485,
            "longitude": 77.0975,
            "description": "Prestigious commercial tower on Golf Course Road, DLF Phase 5.",
            "category": "Skyscraper",
            "city": "gurgaon"
        },
        {
            "number": 5,
            "title": "Sector 29 Leisure Hub",
            "latitude": 28.4680,
            "longitude": 77.0678,
            "description": "Lively district with open parks, microbreweries, and dining venues.",
            "category": "Entertainment",
            "city": "gurgaon"
        },
        {
            "number": 6,
            "title": "Aravalli Biodiversity Park",
            "latitude": 28.4845,
            "longitude": 77.1085,
            "description": "Ecological reserve and walking trails amidst ancient Aravalli flora.",
            "category": "Park",
            "city": "gurgaon"
        },
        {
            "number": 7,
            "title": "The Camellias (DLF 5)",
            "latitude": 28.4550,
            "longitude": 77.0965,
            "description": "Super-luxury architectural skyscrapers along Golf Course Road.",
            "category": "Skyscraper",
            "city": "gurgaon"
        },
        # London Landmarks
        {
            "number": 1,
            "title": "Tower Bridge",
            "latitude": 51.5055,
            "longitude": -0.0754,
            "description": "Famous suspension bridge built between 1886 and 1894 over the River Thames.",
            "category": "Bridge",
            "city": "london"
        },
        {
            "number": 2,
            "title": "Tower of London",
            "latitude": 51.5081,
            "longitude": -0.0759,
            "description": "Historic castle and UNESCO World Heritage site housing the Crown Jewels.",
            "category": "Castle",
            "city": "london"
        },
        {
            "number": 3,
            "title": "HMS Belfast",
            "latitude": 51.5066,
            "longitude": -0.0814,
            "description": "Town-class light cruiser museum ship anchored permanently on the Thames.",
            "category": "Museum",
            "city": "london"
        },
        {
            "number": 4,
            "title": "City Hall",
            "latitude": 51.5048,
            "longitude": -0.0790,
            "description": "Distinctive Norman Foster-designed landmark on the south bank.",
            "category": "Architecture",
            "city": "london"
        },
        {
            "number": 5,
            "title": "St. Katharine Docks",
            "latitude": 51.5075,
            "longitude": -0.0710,
            "description": "Historic commercial dock, now a marina with dining and yachts.",
            "category": "Marina",
            "city": "london"
        },
        {
            "number": 6,
            "title": "The Shard",
            "latitude": 51.5045,
            "longitude": -0.0865,
            "description": "72-storey skyscraper, the tallest building in the UK.",
            "category": "Skyscraper",
            "city": "london"
        }
    ]

    created = []
    for item in landmarks_to_seed:
        marker = Marker(**item)
        db.add(marker)
        created.append(marker)

    db.commit()
    return created
