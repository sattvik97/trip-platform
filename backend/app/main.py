from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import logging
from app.core.config import settings
from app.api.v1.trips import router as trips_router
from app.api.v1.organizers import router as organizers_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.organizer_trips import router as organizer_trips_router
from app.api.v1.organizer_bookings import router as organizer_bookings_router
from app.api.v1.user_bookings import router as user_bookings_router
from app.api.v1.auth import router as auth_router
from app.api.v1.user_auth import router as user_auth_router
from app.api.v1.trip_images import router as trip_images_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Trip Discovery API")

# Startup safety logs
@app.on_event("startup")
async def startup_event():
    """Log environment-specific warnings and information on startup."""
    if settings.ENV == "test":
        logger.warning("=" * 80)
        logger.warning("WARNING: Running in TEST mode against Azure database")
        logger.warning("This mode uses Azure PostgreSQL (same as production)")
        logger.warning("Any database changes will affect production data")
        logger.warning("=" * 80)
    elif settings.ENV == "prod":
        logger.info("=" * 80)
        logger.info("Running in PROD mode")
        logger.info("All configuration loaded from environment variables")
        logger.info("=" * 80)
    else:
        logger.info(f"Running in LOCAL mode (ENV={settings.ENV})")
    
    # Log storage backend being used
    if settings.uses_azure_storage:
        logger.info(f"Storage: Azure Blob Storage (container: {settings.BLOB_CONTAINER})")
    else:
        logger.info(f"Storage: Local filesystem (directory: {settings.LOCAL_UPLOAD_DIR})")

# Mount static files for media (only for local environment)
# In test/prod, images are served from Azure Blob Storage, not local filesystem
if settings.uses_local_storage:
    backend_dir = Path(__file__).parent.parent  # Go up from app/main.py to backend/
    media_dir = backend_dir / settings.LOCAL_UPLOAD_DIR
    media_dir.mkdir(exist_ok=True, parents=True)
    app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

# Add CORS middleware with config-driven origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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