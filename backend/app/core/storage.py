"""
Storage abstraction layer for trip images.
Currently implements local file storage, but designed to be easily replaced with Azure Blob Storage.
"""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
import aiofiles


class StorageBackend:
    """Abstract base class for storage backends."""
    
    def save_file(self, file: UploadFile, trip_id: str) -> str:
        """
        Save a file and return the public URL.
        Must be implemented by subclasses.
        """
        raise NotImplementedError
    
    def delete_file(self, image_url: str) -> None:
        """
        Delete a file by its public URL.
        Must be implemented by subclasses.
        """
        raise NotImplementedError
    
    def delete_directory(self, trip_id: str) -> None:
        """
        Delete all files in a directory (for trip deletion).
        Must be implemented by subclasses.
        """
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    """Local file system storage backend."""
    
    def __init__(self, base_dir: str = "media", base_url: str = "/media"):
        # Use absolute path to ensure it works regardless of where the app is run from
        if Path(base_dir).is_absolute():
            self.base_dir = Path(base_dir)
        else:
            # Resolve relative to backend directory
            backend_dir = Path(__file__).parent.parent.parent  # Go up from app/core/storage.py to backend/
            self.base_dir = backend_dir / base_dir
        self.base_url = base_url
        # Ensure base directory exists
        self.base_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_trip_dir(self, trip_id: str) -> Path:
        """Get the directory path for a trip's images."""
        trip_dir = self.base_dir / "trips" / trip_id
        trip_dir.mkdir(parents=True, exist_ok=True)
        return trip_dir
    
    def _get_public_url(self, trip_id: str, filename: str) -> str:
        """Generate public URL for an image."""
        return f"{self.base_url}/trips/{trip_id}/{filename}"
    
    async def save_file(self, file: UploadFile, trip_id: str) -> str:
        """
        Save a file to local storage and return the public URL.
        """
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"{uuid.uuid4()}{file_ext}"
        
        trip_dir = self._get_trip_dir(trip_id)
        file_path = trip_dir / filename
        
        # Read and save file
        # The file object may have been read already, so we read from its underlying file
        async with aiofiles.open(file_path, "wb") as f:
            # Read file in chunks to handle large files
            # Reset file pointer if possible
            if hasattr(file.file, 'seek'):
                file.file.seek(0)
            while True:
                chunk = await file.read(8192)  # 8KB chunks
                if not chunk:
                    break
                await f.write(chunk)
        
        return self._get_public_url(trip_id, filename)
    
    def delete_file(self, image_url: str) -> None:
        """
        Delete a file by its public URL.
        """
        # Extract path from URL: /media/trips/{trip_id}/{filename}
        if not image_url.startswith(self.base_url):
            return
        
        relative_path = image_url[len(self.base_url):].lstrip("/")
        file_path = self.base_dir / relative_path
        
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
    
    def delete_directory(self, trip_id: str) -> None:
        """
        Delete all files in a trip's directory.
        """
        trip_dir = self.base_dir / "trips" / trip_id
        if trip_dir.exists() and trip_dir.is_dir():
            # Delete all files in directory
            for file_path in trip_dir.iterdir():
                if file_path.is_file():
                    file_path.unlink()
            # Remove directory if empty
            try:
                trip_dir.rmdir()
            except OSError:
                pass  # Directory not empty or doesn't exist


# Global storage instance
_storage_backend: Optional[StorageBackend] = None


def get_storage_backend() -> StorageBackend:
    """Get the configured storage backend."""
    global _storage_backend
    if _storage_backend is None:
        _storage_backend = LocalStorageBackend()
    return _storage_backend


def set_storage_backend(backend: StorageBackend) -> None:
    """Set a custom storage backend (useful for testing or Azure)."""
    global _storage_backend
    _storage_backend = backend

