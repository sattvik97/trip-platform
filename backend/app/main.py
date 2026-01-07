from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
from app.api.v1.trips import router as trips_router
from app.api.v1.organizers import router as organizers_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.organizer_trips import router as organizer_trips_router
from app.api.v1.organizer_bookings import router as organizer_bookings_router
from app.api.v1.user_bookings import router as user_bookings_router
from app.api.v1.auth import router as auth_router
from app.api.v1.user_auth import router as user_auth_router
from app.api.v1.trip_images import router as trip_images_router

app = FastAPI(title="Trip Discovery API")

# Mount static files for media
# Use absolute path to ensure it works regardless of where the app is run from
backend_dir = Path(__file__).parent.parent  # Go up from app/main.py to backend/
media_dir = backend_dir / "media"
media_dir.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(
    organizers_router,
    prefix="/api/v1/organizers",
    tags=["Organizers"],
)

app.include_router(
    trips_router,
    prefix="/api/v1/trips",
    tags=["Trips"],
)

app.include_router(
    bookings_router,
    prefix="/api/v1/bookings",
    tags=["Bookings"],   # ✅ IMPORTANT
)

app.include_router(
    organizer_trips_router,
    prefix="/api/v1/organizer/trips",
    tags=["Organizer Trips"],
)

app.include_router(
    organizer_bookings_router,
    prefix="/api/v1/organizer/bookings",
    tags=["Organizer Bookings"],
)

app.include_router(
    user_bookings_router,
    prefix="/api/v1/user/bookings",
    tags=["User Bookings"],
)

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

app.include_router(
    user_auth_router,
    prefix="/api/v1/user/auth",
    tags=["User Authentication"],
)

app.include_router(
    trip_images_router,
    prefix="/api/v1",
    tags=["Trip Images"],
)