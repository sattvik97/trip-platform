"use client";

import { useState, useEffect } from "react";
import { getTripImages, TripImage } from "@/src/lib/api/trip-images";
import { getImageUrl } from "@/src/lib/api/config";

interface TripImageGalleryProps {
  tripId: string;
}

export function TripImageGallery({ tripId }: TripImageGalleryProps) {
  const [images, setImages] = useState<TripImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<TripImage | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const fetchedImages = await getTripImages(tripId);
        // Filter out hero image (position 0) - only show gallery images
        const galleryImages = fetchedImages.filter((img) => img.position > 0);
        setImages(galleryImages);
      } catch (err) {
        console.error("Failed to load images:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (tripId) {
      loadImages();
    }
  }, [tripId]);

  if (isLoading || images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Gallery
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <img
                src={getImageUrl(image.image_url)}
                alt={`Gallery image ${image.position}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-8 h-8"
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

          <div className="max-w-7xl max-h-full">
            <img
              src={getImageUrl(selectedImage.image_url)}
              alt="Full size image"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                  setSelectedImage(images[prevIndex]);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                aria-label="Previous image"
              >
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
                  const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                  setSelectedImage(images[nextIndex]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                aria-label="Next image"
              >
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

