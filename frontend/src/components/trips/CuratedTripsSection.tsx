import { Suspense } from "react";
import { getTrips } from "@/src/lib/api/trips";
import { TripCard } from "./TripCard";
import type { Trip } from "@/src/types/trip";

interface CuratedTripsSectionProps {
  title: string;
}

function CuratedTripsGrid({ trips }: { trips: Trip[] }) {
  const displayTrips = trips.slice(0, 3);

  if (displayTrips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No trips found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {displayTrips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

async function CuratedTripsContent() {
  const trips = await getTrips(1, 3);

  return <CuratedTripsGrid trips={trips} />;
}

export function CuratedTripsSection({ title }: CuratedTripsSectionProps) {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        <span className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
          View all →
        </span>
      </div>
      <Suspense
        fallback={
          <div className="text-center py-8">
            <p className="text-gray-500">Loading trips...</p>
          </div>
        }
      >
        <CuratedTripsContent />
      </Suspense>
    </section>
  );
}

