import { Suspense } from "react";
import { getTrips } from "@/src/lib/api/trips";
import { TripCard } from "./TripCard";
import { PaginationControls } from "./PaginationControls";
import type { Trip } from "@/src/types/trip";

interface TripsSectionProps {
  title: string;
  variant?: "primary" | "secondary";
  searchParams?: Promise<{ page?: string }>;
}

function TripsGrid({
  trips,
  maxItems,
}: {
  trips: Trip[];
  maxItems?: number;
}) {
  const displayTrips = maxItems ? trips.slice(0, maxItems) : trips;

  if (displayTrips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No trips found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {displayTrips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

async function TripsContent({
  variant,
  searchParams,
}: {
  variant: "primary" | "secondary";
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const page = params?.page ? parseInt(params.page, 10) : 1;
  const validPage = page > 0 ? page : 1;

  const limit = variant === "primary" ? 20 : 4;
  const trips = await getTrips(validPage, limit);
  const hasMore = trips.length === limit;

  return (
    <>
      <TripsGrid trips={trips} maxItems={variant === "secondary" ? 4 : undefined} />
      {variant === "primary" && (
        <PaginationControls currentPage={validPage} hasMore={hasMore} />
      )}
    </>
  );
}

export function TripsSection({
  title,
  variant = "secondary",
  searchParams,
}: TripsSectionProps) {
  return (
    <section className="mb-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">{title}</h1>
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-gray-500">Loading trips...</p>
          </div>
        }
      >
        <TripsContent variant={variant} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

