"use client";

import Link from "next/link";
import { useState } from "react";
import { getImageUrl as getImageUrlHelper } from "@/src/lib/api/config";
import {
  formatPriceInr,
  formatSeatCopy,
  formatTagLabel,
  formatTripDateRange,
  formatTripDuration,
} from "@/src/lib/tripPresentation";

function getImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  return getImageUrlHelper(imageUrl);
}

interface DiscoverySearchCardProps {
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

export function DiscoverySearchCard({ trip }: DiscoverySearchCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getImageUrl(trip.cover_image_url || undefined);
  const dateRange = formatTripDateRange(trip.start_date, trip.end_date, "short");
  const duration = formatTripDuration(trip.start_date, trip.end_date);

  return (
    <Link
      href={`/trip/${trip.slug}`}
      className="group block overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-lg shadow-slate-950/8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/10"
    >
      <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[#365d73] via-[#4f7e7a] to-[#d6a96f]">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white/85">
            {trip.title.charAt(0)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-sm">
          Live availability
        </div>

        {trip.available_seats <= 3 && (
          <div className="absolute right-4 top-4 rounded-full bg-[#c85d2b] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            Only {formatSeatCopy(trip.available_seats)}
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            {trip.destination}
          </p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-white">
            {trip.title}
          </h3>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Starting from
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {formatPriceInr(trip.price)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f7f1e8] px-3 py-2 text-right text-sm text-slate-700">
            <p className="font-medium">{formatSeatCopy(trip.available_seats)}</p>
            <p className="text-xs text-slate-500">verified seats</p>
          </div>
        </div>

        <div className="grid gap-2 rounded-[1.25rem] bg-[#f7f1e8] p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-4">
            <span>{dateRange}</span>
            <span className="font-medium">{duration}</span>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Approval-based booking helps organizers keep the group fit intentional.
          </p>
        </div>

        {trip.tags && trip.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {trip.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {formatTagLabel(tag)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-sm font-medium text-slate-700">
          <span>Explore trip</span>
          <span className="transition-transform group-hover:translate-x-1">Request to join</span>
        </div>
      </div>
    </Link>
  );
}
