import Link from "next/link";
import { useState } from "react";
import { getImageUrl as getImageUrlHelper } from "@/src/lib/api/config";

function getImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  return getImageUrlHelper(imageUrl);
}

interface SearchTripCardProps {
  trip: {
    id: string;
    slug: string;
    organizer_id: string;
    title: string;
    destination: string;
    price: number;
    start_date: string;
    end_date: string;
    available_seats: number;
    tags: string[] | null;
    cover_image_url: string | null;
  };
}

export function SearchTripCard({ trip }: SearchTripCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getImageUrl(trip.cover_image_url || undefined);
  
  // Calculate duration
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const duration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Format dates
  const formattedStartDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedEndDate = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/trip/${trip.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 h-full flex flex-col"
    >
      {/* Hero Image */}
      <div className="relative h-56 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold opacity-80">
            {trip.title.charAt(0)}
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">
              ₹{trip.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-600">/ person</span>
          </div>
        </div>

        {/* Seats Left Pill */}
        {trip.available_seats > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
            <span className="text-sm font-medium text-gray-700">
              {trip.available_seats} {trip.available_seats === 1 ? "seat" : "seats"} left
            </span>
          </div>
        )}

        {/* Low availability warning */}
        {trip.available_seats > 0 && trip.available_seats <= 3 && (
          <div className="absolute bottom-4 left-4 right-4 bg-orange-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <span className="text-sm font-medium text-white">
              Only {trip.available_seats} {trip.available_seats === 1 ? "seat" : "seats"} remaining
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Trip Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {trip.title}
        </h3>

        {/* Location + Duration */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            <span className="text-sm font-medium">{trip.destination}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm">{duration} {duration === 1 ? "day" : "days"}</span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            <span className="text-sm">
              {formattedStartDate} - {formattedEndDate}
            </span>
          </div>
        </div>

        {/* Category Tags */}
        {trip.tags && trip.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {trip.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
              >
                {tag.replace(/_/g, " ")}
              </span>
            ))}
            {trip.tags.length > 3 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                +{trip.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Primary CTA */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
              View Trip
            </span>
            <svg
              className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform"
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
          </div>
        </div>
      </div>
    </Link>
  );
}

