from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func

from app.models.trip_image import TripImage
from app.models.trip import Trip, TripStatus


def get_trip_images(db: Session, trip_id: str) -> List[TripImage]:
    """Get all images for a trip, ordered by position."""
    return (
        db.query(TripImage)
        .filter(TripImage.trip_id == trip_id)
        .order_by(TripImage.position.asc())
        .all()
    )


def get_trip_image_by_id(db: Session, image_id: str) -> Optional[TripImage]:
    """Get a trip image by ID."""
    return db.query(TripImage).filter(TripImage.id == image_id).first()


def count_trip_images(db: Session, trip_id: str) -> int:
    """Count the number of images for a trip."""
    return db.query(func.count(TripImage.id)).filter(TripImage.trip_id == trip_id).scalar() or 0


def get_next_position(db: Session, trip_id: str) -> int:
    """Get the next available position for a trip image."""
    max_position = (
        db.query(func.max(TripImage.position))
        .filter(TripImage.trip_id == trip_id)
        .scalar()
    )
    if max_position is None:
        return 0
    return max_position + 1


def create_trip_image(
    db: Session,
    trip_id: str,
    image_url: str,
    position: Optional[int] = None,
) -> TripImage:
    """Create a new trip image."""
    if position is None:
        position = get_next_position(db, trip_id)
    
    trip_image = TripImage(
        trip_id=trip_id,
        image_url=image_url,
        position=position,
    )
    
    db.add(trip_image)
    db.commit()
    db.refresh(trip_image)
    return trip_image


def delete_trip_image(db: Session, image_id: str) -> bool:
    """Delete a trip image. Returns True if deleted, False if not found."""
    trip_image = get_trip_image_by_id(db, image_id)
    if not trip_image:
        return False
    
    db.delete(trip_image)
    db.commit()
    return True


def reorder_trip_images(
    db: Session,
    trip_id: str,
    image_ids: List[str],
) -> List[TripImage]:
    """
    Reorder trip images based on the provided list of image IDs.
    Updates positions to match the order in the list.
    """
    # Verify all images belong to the trip
    existing_images = (
        db.query(TripImage)
        .filter(
            TripImage.trip_id == trip_id,
            TripImage.id.in_(image_ids),
        )
        .all()
    )
    
    if len(existing_images) != len(image_ids):
        raise ValueError("Some image IDs do not belong to this trip")
    
    # Create a mapping of image_id to image object
    image_map = {img.id: img for img in existing_images}
    
    # Update positions based on the order in image_ids
    for position, image_id in enumerate(image_ids):
        if image_id in image_map:
            image_map[image_id].position = position
    
    db.commit()
    
    # Return updated images in order
    return [image_map[img_id] for img_id in image_ids]


def verify_trip_ownership(db: Session, trip_id: str, organizer_id: str) -> Trip:
    """Verify that the organizer owns the trip. Raises exceptions if not."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    
    if not trip:
        raise FileNotFoundError("Trip not found")
    
    if trip.organizer_id != organizer_id:
        raise PermissionError("You do not have permission to modify this trip")
    
    return trip


def verify_trip_draft_status(trip: Trip) -> None:
    """Verify that the trip is in DRAFT status. Raises exception if not."""
    if trip.status != TripStatus.DRAFT:
        raise ValueError("Images can only be modified while the trip is in draft status")


def cleanup_trip_images(db: Session, trip_id: str) -> None:
    """
    Clean up all image files for a trip.
    This should be called when a trip is deleted.
    Note: Database records are automatically deleted via cascade delete.
    """
    from app.core.storage import get_storage_backend
    
    # Get all images before they're deleted (for file cleanup)
    images = get_trip_images(db, trip_id)
    
    # Delete files from storage
    storage = get_storage_backend()
    for image in images:
        storage.delete_file(image.image_url)
    
    # Delete the trip's image directory
    storage.delete_directory(trip_id)

