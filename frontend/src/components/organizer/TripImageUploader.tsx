"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getTripImages,
  uploadTripImage,
  deleteTripImage,
  reorderTripImages,
  TripImage,
} from "@/src/lib/api/trip-images";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function getImageUrl(imageUrl: string): string {
  // If URL is already absolute, return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  // If URL is relative, prepend API base URL
  return `${apiBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

interface TripImageUploaderProps {
  tripId: string;
  tripStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export function TripImageUploader({
  tripId,
  tripStatus,
}: TripImageUploaderProps) {
  const [images, setImages] = useState<TripImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isDraft = tripStatus === "DRAFT";
  const maxImages = 8;

  const loadImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const fetchedImages = await getTripImages(tripId);
      setImages(fetchedImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload JPG, PNG, or WEBP images.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed per trip.`);
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      const newImage = await uploadTripImage(tripId, file);
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      setError("");
      await deleteTripImage(tripId, imageId);
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  const handleDragStart = (index: number) => {
    if (!isDraft) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isDraft || draggedIndex === null) return;
    e.preventDefault();

    if (draggedIndex !== index) {
      const newImages = [...images];
      const draggedImage = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(index, 0, draggedImage);
      setImages(newImages);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = async () => {
    if (!isDraft || draggedIndex === null) return;

    try {
      setError("");
      const imageIds = images.map((img) => img.id);
      await reorderTripImages(tripId, imageIds);
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder images");
      // Reload to restore original order
      await loadImages();
    } finally {
      setDraggedIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraft) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Create a synthetic event for file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/jpg,image/png,image/webp";
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      const syntheticEvent = {
        target: input,
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500">Loading images...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Trip Images
        </h3>
        {!isDraft && (
          <p className="text-sm text-gray-600 mb-4">
            Images can only be edited while the trip is in draft status.
          </p>
        )}
        {isDraft && (
          <p className="text-sm text-gray-600 mb-4">
            Upload up to {maxImages} images. The first image (position 0) will
            be used as the cover image.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Upload Area */}
      {isDraft && images.length < maxImages && (
        <div
          className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="trip-image-upload"
          />
          <label
            htmlFor="trip-image-upload"
            className="cursor-pointer block"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">
                {isUploading
                  ? "Uploading..."
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WEBP up to 5MB
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable={isDraft}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group border-2 rounded-lg overflow-hidden ${
                index === 0
                  ? "border-indigo-500 ring-2 ring-indigo-200"
                  : "border-gray-200"
              } ${isDraft ? "cursor-move" : ""}`}
            >
              <img
                src={getImageUrl(image.image_url)}
                alt={`Trip image ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  Cover
                </div>
              )}
              {isDraft && (
                <button
                  onClick={() => handleDelete(image.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                Position {image.position}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No images uploaded yet.</p>
          {isDraft && (
            <p className="text-sm mt-2">
              Upload images using the area above.
            </p>
          )}
        </div>
      )}

      {images.length >= maxImages && isDraft && (
        <p className="mt-4 text-sm text-gray-600">
          Maximum {maxImages} images reached. Delete an image to upload a new
          one.
        </p>
      )}
    </div>
  );
}

