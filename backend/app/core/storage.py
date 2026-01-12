"""
Storage abstraction layer for trip images.
Supports local filesystem storage and Azure Blob Storage.
"""
import os
import uuid
import logging
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
import aiofiles

logger = logging.getLogger(__name__)


class StorageBackend:
    """Abstract base class for storage backends."""
    
    async def save_file(self, file: UploadFile, trip_id: str) -> str:
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


class AzureBlobStorageBackend(StorageBackend):
    """Azure Blob Storage backend."""
    
    def __init__(self, connection_string: str, container_name: str):
        try:
            from azure.storage.blob import BlobServiceClient
            from azure.core.exceptions import AzureError
        except ImportError:
            raise ImportError(
                "azure-storage-blob is required for Azure storage. "
                "Install it with: pip install azure-storage-blob"
            )
        
        self.connection_string = connection_string
        self.container_name = container_name
        self.AzureError = AzureError  # Store for use in other methods
        
        if not connection_string:
            raise ValueError("BLOB_CONNECTION_STRING is required for Azure storage")
        
        try:
            self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            self.container_client = self.blob_service_client.get_container_client(container_name)
            # Ensure container exists
            if not self.container_client.exists():
                self.container_client.create_container()
        except AzureError as e:
            raise ValueError(f"Failed to initialize Azure Blob Storage: {str(e)}")
        except Exception as e:
            raise ValueError(f"Unexpected error initializing Azure Blob Storage: {str(e)}")
    
    def _get_blob_name(self, trip_id: str, filename: str) -> str:
        """Generate blob name for an image."""
        return f"trips/{trip_id}/{filename}"
    
    def _get_public_url(self, blob_name: str) -> str:
        """Generate public URL for a blob."""
        # Azure Blob Storage URL format: https://{account}.blob.core.windows.net/{container}/{blob}
        account_name = self.blob_service_client.account_name
        return f"https://{account_name}.blob.core.windows.net/{self.container_name}/{blob_name}"
    
    async def save_file(self, file: UploadFile, trip_id: str) -> str:
        """
        Save a file to Azure Blob Storage and return the public URL.
        """
        from azure.storage.blob import ContentSettings
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"{uuid.uuid4()}{file_ext}"
        blob_name = self._get_blob_name(trip_id, filename)
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Azure Blob Storage
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=blob_name
        )
        
        # Set content type based on file extension
        content_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        content_type = content_type_map.get(file_ext.lower(), "application/octet-stream")
        
        # Create ContentSettings with content_type and cache_control
        content_settings = ContentSettings(
            content_type=content_type,
            cache_control="public, max-age=31536000"
        )
        
        try:
            blob_client.upload_blob(
                file_content,
                overwrite=True,
                content_settings=content_settings
            )
        except self.AzureError as e:
            raise ValueError(f"Failed to upload file to Azure Blob Storage: {str(e)}")
        except Exception as e:
            raise ValueError(f"Unexpected error uploading file to Azure Blob Storage: {str(e)}")
        
        return self._get_public_url(blob_name)
    
    def delete_file(self, image_url: str) -> None:
        """
        Delete a file from Azure Blob Storage by its public URL.
        """
        # Extract blob name from URL
        # URL format: https://{account}.blob.core.windows.net/{container}/{blob_name}
        try:
            # Parse the URL to extract blob name
            if "/" not in image_url:
                return
            
            # Extract the blob name (everything after container name)
            parts = image_url.split(f"/{self.container_name}/")
            if len(parts) != 2:
                return
            
            blob_name = parts[1]
            
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            if blob_client.exists():
                blob_client.delete_blob()
        except self.AzureError as e:
            # Log error but don't raise - file deletion is not critical
            logger.warning(f"Failed to delete blob from Azure: {str(e)}")
        except Exception as e:
            # Log unexpected errors
            logger.warning(f"Unexpected error deleting blob from Azure: {str(e)}")
    
    def delete_directory(self, trip_id: str) -> None:
        """
        Delete all blobs in a trip's directory.
        """
        prefix = f"trips/{trip_id}/"
        try:
            blobs = self.container_client.list_blobs(name_starts_with=prefix)
            for blob in blobs:
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name,
                    blob=blob.name
                )
                if blob_client.exists():
                    blob_client.delete_blob()
        except self.AzureError as e:
            # Log error but don't raise - directory deletion is not critical
            logger.warning(f"Failed to delete blobs from Azure: {str(e)}")
        except Exception as e:
            # Log unexpected errors
            logger.warning(f"Unexpected error deleting blobs from Azure: {str(e)}")


# Global storage instance
_storage_backend: Optional[StorageBackend] = None


def get_storage_backend() -> StorageBackend:
    """Get the configured storage backend based on environment configuration."""
    global _storage_backend
    if _storage_backend is None:
        from app.core.config import settings
        
        if settings.uses_azure_storage:
            # Use Azure Blob Storage for test/prod
            _storage_backend = AzureBlobStorageBackend(
                connection_string=settings.BLOB_CONNECTION_STRING,
                container_name=settings.BLOB_CONTAINER
            )
        else:
            # Use local filesystem storage for local environment
            _storage_backend = LocalStorageBackend(
                base_dir=settings.LOCAL_UPLOAD_DIR,
                base_url="/media"
            )
    return _storage_backend


def set_storage_backend(backend: StorageBackend) -> None:
    """Set a custom storage backend (useful for testing)."""
    global _storage_backend
    _storage_backend = backend

