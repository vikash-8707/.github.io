from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MarkerBase(BaseModel):
    title: str = Field(..., example="Tower Bridge")
    latitude: float = Field(..., example=51.5055)
    longitude: float = Field(..., example=-0.0754)
    description: Optional[str] = Field(None, example="Iconic Victorian suspension bridge.")
    number: Optional[int] = Field(None, example=1)
    category: Optional[str] = Field("Landmark", example="Landmark")
    city: Optional[str] = Field("gurgaon", example="gurgaon")

class MarkerCreate(MarkerBase):
    pass

class MarkerUpdate(BaseModel):
    title: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    number: Optional[int] = None
    category: Optional[str] = None
    city: Optional[str] = None

class MarkerResponse(MarkerBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
