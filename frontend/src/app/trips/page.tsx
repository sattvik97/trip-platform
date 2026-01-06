import { Suspense } from "react";
import Link from "next/link";
import type { Trip } from "@/src/types/trip";
import { getTrips } from "@/src/lib/api/trips";
import { HomeTripCard } from "@/src/components/home/HomeTripCard";
import { TagFilters } from "@/src/components/trips/TagFilters";
import { PaginationControls } from "@/src/components/trips/PaginationControls";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function TripsListContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; tag?: string | string[] }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;
  
  // Handle both single tag (backward compat) and multiple tags
  const tagParam = params.tag;
  const tags = Array.isArray(tagParam)
    ? tagParam
    : tagParam
      ? [tagParam]
      : [];

  // Validate pagination params
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;

  const trips = await getTrips({
    page: validPage,
    limit: validLimit,
    tags: tags.length > 0 ? tags : undefined,
  });

  const hasMore = trips.length === validLimit; // Simple check: if we got full limit, there might be more
  const totalTrips = hasMore
    ? validPage * validLimit + 1
    : (validPage - 1) * validLimit + trips.length;

  if (trips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {tags.length > 0 ? "No trips found" : "No trips available"}
          </h3>
          <p className="text-gray-500 mb-6">
            {tags.length > 0
              ? `No trips match the selected tags. Try selecting different tags.`
              : "Check back soon for new trips!"}
          </p>
          {tags.length > 0 && (
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Clear filters
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trips.map((trip) => (
          <HomeTripCard
            key={trip.id}
            title={trip.title}
            location={trip.destination}
            date={formatDate(trip.start_date)}
            seatsAvailable={trip.available_seats}
            imageUrl={trip.cover_image_url || undefined}
            organizerId={trip.organizer_id}
            tripSlug={trip.slug}
          />
        ))}
      </div>
      <PaginationControls
        currentPage={validPage}
        hasMore={hasMore}
        totalTrips={totalTrips}
        limit={validLimit}
      />
    </>
  );
}

interface TripsPageProps {
  searchParams: Promise<{ page?: string; limit?: string; tag?: string | string[] }>;
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  // Redirect to discover page for category-first experience
  // Keeping this for backward compatibility with query params
  const params = await searchParams;
  const tagParam = params.tag;
  
  // If no tags, redirect to discover listing
  if (!tagParam) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Discover Trips</h1>
          <p className="text-gray-600 mb-6">
            Browse trips by category for a better experience.
          </p>
          <a
            href="/discover"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Categories
          </a>
        </div>
      </main>
    );
  }

  // If tags are present, show filtered results (backward compatibility)
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Discover Trips</h1>

      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-gray-500">Loading filters...</p>
          </div>
        }
      >
        <TagFilters />
      </Suspense>

      <Suspense
        fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading trips...</p>
          </div>
        }
      >
        <TripsListContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
