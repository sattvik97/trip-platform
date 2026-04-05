import Link from "next/link";
import { EditorialTripCard } from "./EditorialTripCard";
import type { Trip } from "@/src/types/trip";
import { formatTripDate } from "@/src/lib/tripPresentation";

interface SliderSectionProps {
  title: string;
  trips: Trip[];
  viewAllHref?: string;
}

export function SliderSection({ title, trips, viewAllHref = "/trips" }: SliderSectionProps) {
  const displayTrips = trips.slice(0, 5);

  return (
    <section className="mb-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Curated collection
            </p>
            <h2 className="font-display text-4xl font-semibold text-slate-950">{title}</h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950 md:inline-flex"
          >
            View collection
          </Link>
        </div>
        {displayTrips.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 py-12 text-center">
            <p className="mb-6 text-lg text-slate-500">Trips for this collection are on the way.</p>
            <Link
              href={viewAllHref}
              className="inline-flex rounded-full border border-slate-300 px-4 py-2 font-medium text-transparent transition-colors before:text-slate-700 before:content-['View_collection'] hover:border-slate-950"
            >
              View all →
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-6">
                {displayTrips.map((trip) => (
                  <div key={trip.id} className="flex-shrink-0 w-80 md:w-96">
                    <EditorialTripCard
                      title={trip.title}
                      location={trip.destination}
                      date={formatTripDate(trip.start_date, "long")}
                      seatsAvailable={trip.available_seats}
                      price={trip.price}
                      imageUrl={trip.cover_image_url || undefined}
                      tripSlug={trip.slug}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end md:hidden">
              <Link
                href={viewAllHref}
                className="inline-flex rounded-full border border-slate-300 px-4 py-2 font-medium text-transparent transition-colors before:text-slate-700 before:content-['View_collection'] hover:border-slate-950"
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
