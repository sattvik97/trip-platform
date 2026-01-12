"use client";

import Link from "next/link";
import { useState } from "react";
import { getImageUrl as getImageUrlHelper } from "@/src/lib/api/config";

function getImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  return getImageUrlHelper(imageUrl);
}

interface HomeTripCardProps {
  title: string;
  location: string;
  date: string;
  seatsAvailable?: number;
  price?: number;
  categoryBadge?: string;
  imageUrl?: string;
  organizerId: string;
  tripSlug: string;
}

export function HomeTripCard({
  title,
  location,
  date,
  seatsAvailable = 12,
  price,
  categoryBadge,
  imageUrl,
  organizerId,
  tripSlug,
}: HomeTripCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageUrl ? getImageUrl(imageUrl) : undefined;

  return (
    <Link
      href={`/trip/${tripSlug}`}
      className="block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 w-full hover:scale-[1.02]"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold opacity-80">
            {title.charAt(0)}
          </div>
        )}
        {/* Category Badge */}
        {categoryBadge && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {categoryBadge}
          </div>
        )}
        {/* Seats Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
          {seatsAvailable} seats left
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        {price !== undefined && (
          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900">₹{price.toLocaleString()}</span>
            <span className="text-sm text-gray-500 ml-1">per person</span>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
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
            <span className="text-sm">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
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
            <span className="text-sm">{date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
