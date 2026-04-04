"use client";

import Link from "next/link";
import { useState } from "react";
import { getImageUrl as getImageUrlHelper } from "@/src/lib/api/config";
import { formatPriceInr, formatSeatCopy } from "@/src/lib/tripPresentation";

function getImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  return getImageUrlHelper(imageUrl);
}

interface EditorialTripCardProps {
  title: string;
  location: string;
  date: string;
  seatsAvailable?: number;
  price?: number;
  categoryBadge?: string;
  imageUrl?: string;
  tripSlug: string;
}

export function EditorialTripCard({
  title,
  location,
  date,
  seatsAvailable = 12,
  price,
  categoryBadge,
  imageUrl,
  tripSlug,
}: EditorialTripCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageUrl ? getImageUrl(imageUrl) : undefined;

  return (
    <Link
      href={`/trip/${tripSlug}`}
      className="group block w-full overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-lg shadow-slate-950/8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/10"
    >
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-[#365d73] via-[#4f7e7a] to-[#d6a96f]">
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white/85">
            {title.charAt(0)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

        {categoryBadge && (
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 backdrop-blur-sm">
            {categoryBadge}
          </div>
        )}

        <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-sm">
          Live seats
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              {location}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold leading-none">
              {title}
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
              Availability
            </p>
            <p className="text-sm font-semibold">{formatSeatCopy(seatsAvailable)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {price !== undefined && (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Starting from
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {formatPriceInr(price)}
              </p>
            </div>
            <p className="text-sm text-slate-500">per traveler</p>
          </div>
        )}

        <div className="grid gap-2 rounded-[1.25rem] bg-[#f7f1e8] p-4 text-slate-700">
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span>{location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{date}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-sm font-medium text-slate-700">
          <span>Open trip details</span>
          <span className="transition-transform group-hover:translate-x-1">View trip</span>
        </div>
      </div>
    </Link>
  );
}
