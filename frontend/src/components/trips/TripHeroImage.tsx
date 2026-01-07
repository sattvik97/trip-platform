"use client";

import { useState, useEffect } from "react";
import { getTripImages, TripImage } from "@/src/lib/api/trip-images";

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

interface TripHeroImageProps {
  tripId: string;
  title: string;
  location: string;
  dateRange: string;
  tags?: string[] | null;
  seatsAvailable: number;
}

export function TripHeroImage({
  tripId,
  title,
  location,
  dateRange,
  tags,
  seatsAvailable,
}: TripHeroImageProps) {
  const [images, setImages] = useState<TripImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroImage, setHeroImage] = useState<TripImage | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const fetchedImages = await getTripImages(tripId);
        setImages(fetchedImages);
        // Find hero image (position 0) or use first image
        const coverImage = fetchedImages.find((img) => img.position === 0) || fetchedImages[0] || null;
        setHeroImage(coverImage);
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

  if (isLoading) {
    return (
      <div className="w-full h-[45vh] md:h-[60vh] bg-gradient-to-br from-purple-400 to-blue-500 animate-pulse"></div>
    );
  }

  return (
    <div className="relative w-full h-[45vh] md:h-[60vh] overflow-hidden">
      {/* Hero Image or Gradient Fallback */}
      {heroImage ? (
        <img
          src={getImageUrl(heroImage.image_url)}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500"></div>
      )}

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20"></div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
        <div className="max-w-7xl mx-auto w-full">
          {/* Seats Badge - Top Right */}
          <div className="absolute top-6 right-6 md:top-12 md:right-12">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-gray-900">
              {seatsAvailable} {seatsAvailable === 1 ? "seat" : "seats"} left
            </div>
          </div>

          {/* Main Content - Bottom Left */}
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-4 text-white">
              {/* Location */}
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-lg md:text-xl font-medium">{location}</span>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-lg md:text-xl font-medium">{dateRange}</span>
              </div>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

