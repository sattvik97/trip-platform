"use client";

import { useState, useMemo } from "react";
import type { Trip } from "@/src/types/trip";
import { DiscoverySearchCard } from "./DiscoverySearchCard";
import { SortControls, type SortOption } from "./SortControls";
import { PaginationControls } from "@/src/components/trips/PaginationControls";

interface SearchResultsGridProps {
  trips: Trip[];
  currentPage: number;
  hasMore: boolean;
  totalTrips: number;
  limit: number;
}

export function SearchResultsGrid({
  trips,
  currentPage,
  hasMore,
  totalTrips,
  limit,
}: SearchResultsGridProps) {
  const [sortOption, setSortOption] = useState<SortOption>("recommended");

  const sortedTrips = useMemo(() => {
    const tripsCopy = [...trips];

    switch (sortOption) {
      case "price-low":
        return tripsCopy.sort((a, b) => a.price - b.price);
      case "price-high":
        return tripsCopy.sort((a, b) => b.price - a.price);
      case "duration": {
        const getDuration = (trip: Trip) => {
          const start = new Date(trip.start_date);
          const end = new Date(trip.end_date);
          return Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
        };
        return tripsCopy.sort((a, b) => getDuration(a) - getDuration(b));
      }
      case "earliest": {
        return tripsCopy.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      }
      case "recommended":
      default:
        // Keep original order (already sorted by backend)
        return tripsCopy;
    }
  }, [trips, sortOption]);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <SortControls
          onSortChange={setSortOption}
          currentSort={sortOption}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedTrips.map((trip) => (
          <DiscoverySearchCard key={trip.id} trip={trip} />
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        hasMore={hasMore}
        totalTrips={totalTrips}
        limit={limit}
      />
    </>
  );
}

