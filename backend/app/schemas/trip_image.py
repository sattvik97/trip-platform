from pydantic import BaseModel
from typing import List


class TripImageResponse(BaseModel):
    id: str
    trip_id: str
    image_url: str
    position: int
    created_at: str

    class Config:
        from_attributes = True


class TripImageReorderRequest(BaseModel):
    image_ids: List[str]


class TripImageListResponse(BaseModel):
    images: List[TripImageResponse]

