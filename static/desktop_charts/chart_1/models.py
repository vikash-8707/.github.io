from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime, timezone
from database import Base

class Marker(Base):
    __tablename__ = "markers"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=True, index=True)  # Visual badge number (1, 2, 3...)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    category = Column(String(100), default="Landmark")
    city = Column(String(50), default="gurgaon", index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
