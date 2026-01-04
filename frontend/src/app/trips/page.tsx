import { Suspense } from "react";
import Link from "next/link";
import type { Trip } from "@/src/types/trip";
import { getTrips } from "@/src/lib/api/trips";

interface TripsPageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}


function TripCard({ trip }: { trip: Trip }) {
  const date = new Date(trip.start_date);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{trip.title}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {trip.available_seats} seats available
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <p className="text-gray-600 flex items-center gap-2">
          <span className="font-medium">Location:</span>
          {trip.destination}
        </p>
        <p className="text-gray-600 flex items-center gap-2">
          <span className="font-medium">Date:</span>
          {formattedDate}
        </p>
      </div>
      <Link
        href={`/trips/${trip.organizer_id}/${trip.slug}`}
        className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
      >
        View Details →
      </Link>
    </div>
  );
}

function PaginationControls({
  currentPage,
  hasMore,
}: {
  currentPage: number;
  hasMore: boolean;
}) {
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = hasMore ? currentPage + 1 : null;

  return (
    <div className="flex justify-center items-center gap-4 mt-8">
      {prevPage ? (
        <Link
          href={`/trips?page=${prevPage}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Previous
        </Link>
      ) : (
        <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">
          Previous
        </span>
      )}

      <span className="text-gray-600">Page {currentPage}</span>

      {nextPage ? (
        <Link
          href={`/trips?page=${nextPage}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Next
        </Link>
      ) : (
        <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">
          Next
        </span>
      )}
    </div>
  );
}

async function TripsList({ page, limit }: { page: number; limit: number }) {
  const trips = await getTrips({ page, limit });
  const hasMore = trips.length === limit; // Simple check: if we got full limit, there might be more

  return (
    <>
      {trips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No trips available yet</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
          <PaginationControls currentPage={page} hasMore={hasMore} />
        </>
      )}
    </>
  );
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;

  // Validate pagination params
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Discover Trips</h1>
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-gray-500">Loading trips...</p>
          </div>
        }
      >
        <TripsList page={validPage} limit={validLimit} />
      </Suspense>
    </main>
  );
}

