from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from pathlib import Path
import logging
from urllib.parse import urlparse, urlunparse
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

# Disable automatic trailing slash redirects globally
# This prevents 307 redirects that can cause HTTPS → HTTP downgrade issues
# in production environments behind reverse proxies (Azure App Service/Gunicorn)
app = FastAPI(title="Trip Discovery API", redirect_slashes=False)

# HTTPS Redirect Middleware
# Ensures all redirect Location headers use HTTPS in production.
# This is critical when behind reverse proxies (Azure App Service/Gunicorn)
# that may generate redirects with http:// instead of https://
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """
    Ensures all redirect Location headers use HTTPS in production.
    
    Why this is needed:
    - Azure App Service/Gunicorn may generate redirects with http://
    - Browsers block HTTPS → HTTP downgrades for cross-origin requests with Authorization headers
    - This middleware intercepts redirects and ensures Location headers use https://
    
    How it works:
    - Checks if response is a redirect (3xx status)
    - Extracts Location header
    - If Location uses http://, converts to https://
    - Preserves all other headers and response properties
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Only process redirects (3xx status codes)
        if 300 <= response.status_code < 400:
            location = response.headers.get("Location")
            if location:
                # Parse the URL
                parsed = urlparse(location)
                
                # If scheme is http, convert to https
                # Only do this in production/test environments (not local)
                if parsed.scheme == "http" and settings.ENV in ("prod", "test"):
                    # Reconstruct URL with https
                    new_parsed = parsed._replace(scheme="https")
                    new_location = urlunparse(new_parsed)
                    
                    # Create new response with corrected Location header
                    # Preserve all other headers and status code
                    # For redirects, body is typically empty, so we don't need to preserve it
                    headers = dict(response.headers)
                    headers["Location"] = new_location
                    
                    return Response(
                        status_code=response.status_code,
                        headers=headers,
                    )
        
        return response

# OPTIONS preflight handler middleware
# This MUST be added FIRST so it executes LAST (innermost).
# FastAPI middleware executes in reverse order (last added = first executed).
#
# Execution order:
#   1. OptionsHandler (innermost, executes last) - short-circuits OPTIONS
#   2. HTTPSRedirect (middle) - fixes Location headers
#   3. CORS (outermost, executes first) - sets CORS headers on all responses
#   4. Routes (app level)
#
# Flow for OPTIONS request:
#   Request → CORS (processes, prepares to add headers) 
#          → HTTPSRedirect (passes through)
#          → OptionsHandler (detects OPTIONS, returns 200)
#          → Response passes back through HTTPSRedirect → CORS (headers added) → Client
#
# Flow for regular request:
#   Request → CORS → HTTPSRedirect → OptionsHandler (passes through) → Routes → Response → HTTPSRedirect → CORS → Client
class OptionsHandlerMiddleware(BaseHTTPMiddleware):
    """
    Handles OPTIONS preflight requests by returning 200 immediately.
    
    FastAPI validates request bodies for all HTTP methods, including OPTIONS.
    Since OPTIONS preflight requests have no body, Pydantic validation fails
    and returns 400. This middleware intercepts OPTIONS requests and returns
    a 200 response before FastAPI processes the route.
    
    Why this works locally but fails in production:
    - Locally: Frontend uses proxy/same-origin, so browser never sends OPTIONS preflight
    - Production: Different origins trigger preflight, which hits this validation issue
    """
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            # Return 200 immediately for OPTIONS preflight
            # Response will pass back through CORS middleware (executed before this)
            # which will add the necessary CORS headers
            return Response(status_code=200)
        return await call_next(request)

# Add middleware in reverse order (last added = first executed)
# Execution order: CORS → HTTPSRedirect → OptionsHandler → Routes

# Add OptionsHandler FIRST so it executes LAST (innermost)
# This allows CORS and HTTPSRedirect to process the request/response
app.add_middleware(OptionsHandlerMiddleware)

# Add HTTPSRedirect AFTER OptionsHandler (so it executes BEFORE OptionsHandler)
# This ensures redirect Location headers are fixed before CORS processes them
app.add_middleware(HTTPSRedirectMiddleware)

# CRITICAL: Add CORS middleware LAST (so it executes FIRST, outermost).
# This ensures CORS headers are added to all responses, including OPTIONS preflight.
# FastAPI middleware executes in reverse order (last added = first executed),
# so adding CORS last makes it the outermost middleware
cors_origins = settings.cors_origins_list
logger.info(f"CORS origins configured: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

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
    
    # Log CORS configuration for debugging
    logger.info(f"CORS origins: {cors_origins}")
    logger.info(f"CORS origins count: {len(cors_origins)}")

# Mount static files for media (only for local environment)
# In test/prod, images are served from Azure Blob Storage, not local filesystem
if settings.uses_local_storage:
    backend_dir = Path(__file__).parent.parent  # Go up from app/main.py to backend/
    media_dir = backend_dir / settings.LOCAL_UPLOAD_DIR
    media_dir.mkdir(exist_ok=True, parents=True)
    app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

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