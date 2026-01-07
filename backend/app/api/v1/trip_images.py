from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.db.deps import get_db
from app.core.auth import require_organizer
from app.core.storage import get_storage_backend
from app.schemas.trip_image import (
    TripImageResponse,
    TripImageListResponse,
    TripImageReorderRequest,
)
from app.crud.trip_image import (
    get_trip_images,
    create_trip_image,
    delete_trip_image,
    reorder_trip_images,
    count_trip_images,
    verify_trip_ownership,
    verify_trip_draft_status,
    get_trip_image_by_id,
)
from app.crud.trip import get_trip_by_id
from app.models.trip import TripStatus

router = APIRouter()

# Maximum number of images per trip
MAX_IMAGES_PER_TRIP = 8
# Maximum file size: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024
# Allowed file types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_image_file(file: UploadFile) -> None:
    """Validate image file type and size."""
    # Check file extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename",
        )
    
    file_ext = file.filename.lower().split(".")[-1] if "." in file.filename else ""
    if f".{file_ext}" not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: JPG, PNG, WEBP",
        )


@router.post(
    "/trips/{trip_id}/images",
    response_model=TripImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_trip_image(
    trip_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """
    Upload an image for a trip.
    Requires organizer authentication and ownership.
    Only allowed for DRAFT trips.
    Maximum 8 images per trip.
    """
    # Verify ownership and status
    trip = verify_trip_ownership(db, trip_id, organizer_id)
    verify_trip_draft_status(trip)
    
    # Check image count limit
    current_count = count_trip_images(db, trip_id)
    if current_count >= MAX_IMAGES_PER_TRIP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_IMAGES_PER_TRIP} images allowed per trip",
        )
    
    # Validate file
    validate_image_file(file)
    
    # Check file size
    # Read file content to check size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit",
        )
    
    # Reset file pointer and create a new UploadFile for storage
    from fastapi import UploadFile as FastAPIUploadFile
    from io import BytesIO
    file_obj = BytesIO(file_content)
    # Reset pointer to beginning
    file_obj.seek(0)
    file_for_storage = FastAPIUploadFile(
        filename=file.filename,
        file=file_obj,
    )
    
    # Save file using storage backend
    storage = get_storage_backend()
    try:
        image_url = await storage.save_file(file_for_storage, trip_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}",
        )
    
    # Create database record
    try:
        trip_image = create_trip_image(db, trip_id, image_url)
        return TripImageResponse(
            id=trip_image.id,
            trip_id=trip_image.trip_id,
            image_url=trip_image.image_url,
            position=trip_image.position,
            created_at=trip_image.created_at.isoformat() if trip_image.created_at else "",
        )
    except Exception as e:
        # Clean up file if database operation fails
        storage.delete_file(image_url)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create image record: {str(e)}",
        )


@router.get(
    "/trips/{trip_id}/images",
    response_model=TripImageListResponse,
)
def get_trip_images_api(
    trip_id: str,
    db: Session = Depends(get_db),
):
    """
    Get all images for a trip (public endpoint).
    Returns images ordered by position.
    """
    # Verify trip exists (but don't require auth)
    trip = get_trip_by_id(db, trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )
    
    images = get_trip_images(db, trip_id)
    return TripImageListResponse(
        images=[
            TripImageResponse(
                id=img.id,
                trip_id=img.trip_id,
                image_url=img.image_url,
                position=img.position,
                created_at=img.created_at.isoformat() if img.created_at else "",
            )
            for img in images
        ]
    )


@router.delete(
    "/trips/{trip_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_trip_image_api(
    trip_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """
    Delete a trip image.
    Requires organizer authentication and ownership.
    Only allowed for DRAFT trips.
    """
    # Verify ownership and status
    trip = verify_trip_ownership(db, trip_id, organizer_id)
    verify_trip_draft_status(trip)
    
    # Get image to delete (to get URL for file cleanup)
    trip_image = get_trip_image_by_id(db, image_id)
    if not trip_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    # Verify image belongs to trip
    if trip_image.trip_id != trip_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image does not belong to this trip",
        )
    
    # Delete from database
    deleted = delete_trip_image(db, image_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    # Delete file from storage
    storage = get_storage_backend()
    storage.delete_file(trip_image.image_url)


@router.post(
    "/trips/{trip_id}/images/reorder",
    response_model=TripImageListResponse,
)
def reorder_trip_images_api(
    trip_id: str,
    request: TripImageReorderRequest,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """
    Reorder trip images.
    Requires organizer authentication and ownership.
    Only allowed for DRAFT trips.
    """
    # Verify ownership and status
    trip = verify_trip_ownership(db, trip_id, organizer_id)
    verify_trip_draft_status(trip)
    
    if not request.image_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_ids list cannot be empty",
        )
    
    try:
        updated_images = reorder_trip_images(db, trip_id, request.image_ids)
        return TripImageListResponse(
            images=[
                TripImageResponse(
                    id=img.id,
                    trip_id=img.trip_id,
                    image_url=img.image_url,
                    position=img.position,
                    created_at=img.created_at.isoformat() if img.created_at else "",
                )
                for img in updated_images
            ]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

