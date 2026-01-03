from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_trips():
    return {
        "trips": [
            {
                "id": "1",
                "title": "Himalayan Backpacking Trip",
                "price": 12000,
                "destination": "Himachal"
            }
        ]
    }
