from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.trips import router as trips_router
from app.api.v1.organizers import router as organizers_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.organizer_trips import router as organizer_trips_router
from app.api.v1.organizer_bookings import router as organizer_bookings_router
from app.api.v1.user_bookings import router as user_bookings_router
from app.api.v1.auth import router as auth_router
from app.api.v1.user_auth import router as user_auth_router

app = FastAPI(title="Trip Discovery API")

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