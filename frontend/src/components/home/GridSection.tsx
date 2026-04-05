import Link from "next/link";
import { EditorialTripCard } from "./EditorialTripCard";
import type { Trip } from "@/src/types/trip";
import { formatTripDate } from "@/src/lib/tripPresentation";

interface GridSectionProps {
  title: string;
  trips: Trip[];
  columns?: 3 | 4;
  viewAllHref?: string;
}

export function GridSection({ title, trips, columns = 3, viewAllHref = "/trips" }: GridSectionProps) {
  const gridColsClass =
    columns === 3
      ? "md:grid-cols-2 lg:grid-cols-3"
      : "md:grid-cols-2 lg:grid-cols-4";
  const displayTrips = trips.slice(0, 6);

  return (
    <section className="mb-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Explore by feel
            </p>
            <h2 className="font-display text-4xl font-semibold text-slate-950">{title}</h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950 md:inline-flex"
          >
            See all
          </Link>
        </div>
        {displayTrips.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 py-12 text-center">
            <p className="mb-6 text-lg text-slate-500">Fresh trips will land here soon.</p>
            <Link
              href={viewAllHref}
              className="inline-flex rounded-full border border-slate-300 px-4 py-2 font-medium text-transparent transition-colors before:text-slate-700 before:content-['See_all'] hover:border-slate-950"
            >
              View all →
            </Link>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 gap-6 ${gridColsClass}`}>
              {displayTrips.map((trip) => (
                <EditorialTripCard
                  key={trip.id}
                  title={trip.title}
                  location={trip.destination}
                  date={formatTripDate(trip.start_date, "long")}
                  seatsAvailable={trip.available_seats}
                  price={trip.price}
                  imageUrl={trip.cover_image_url || undefined}
                  tripSlug={trip.slug}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-end md:hidden">
              <Link
                href={viewAllHref}
                className="inline-flex rounded-full border border-slate-300 px-4 py-2 font-medium text-transparent transition-colors before:text-slate-700 before:content-['See_all'] hover:border-slate-950"
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
