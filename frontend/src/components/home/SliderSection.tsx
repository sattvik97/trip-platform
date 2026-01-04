import Link from "next/link";
import { HomeTripCard } from "./HomeTripCard";
import type { Trip } from "@/src/types/trip";

interface SliderSectionProps {
  title: string;
  trips: Trip[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SliderSection({ title, trips }: SliderSectionProps) {
  const displayTrips = trips.slice(0, 5);

  return (
    <section className="mb-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>
        {displayTrips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-6">Trips coming soon</p>
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-6">
                {displayTrips.map((trip) => (
                  <HomeTripCard
                    key={trip.id}
                    title={trip.title}
                    location={trip.destination}
                    date={formatDate(trip.start_date)}
                    seatsAvailable={trip.available_seats}
                    organizerId={trip.organizer_id}
                    tripSlug={trip.slug}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Link
                href="/trips"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                View all →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
