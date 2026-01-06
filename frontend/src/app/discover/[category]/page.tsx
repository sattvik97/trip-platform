import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { HomeTripCard } from "@/src/components/home/HomeTripCard";
import { PaginationControls } from "@/src/components/trips/PaginationControls";
import { getCategoryById, HOMEPAGE_CATEGORIES } from "@/src/config/categories";
import { getTrips } from "@/src/lib/api/trips";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function CategoryTripsContent({
  categoryId,
  searchParams,
}: {
  categoryId: string;
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const category = getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;

  // Validate pagination params
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;

  // Fetch trips using category filter
  const trips = await getTrips({
    ...category.filter,
    page: validPage,
    limit: validLimit,
  });

  const hasMore = trips.length === validLimit;
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
            No trips found
          </h3>
          <p className="text-gray-500">
            No trips available in this category yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  // Get category badge text (uppercase category ID)
  const categoryBadge = categoryId.toUpperCase();

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
            price={trip.price}
            categoryBadge={categoryBadge}
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
        basePath={`/discover/${categoryId}`}
      />
    </>
  );
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: categoryId } = await params;
  const category = getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  // Get other categories (excluding current)
  const otherCategories = HOMEPAGE_CATEGORIES.filter(
    (cat) => cat.id !== categoryId
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Category Banner */}
        <div className="bg-gradient-to-br from-blue-400 to-purple-500 text-white py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <h1 className="text-4xl font-bold mb-2">{category.title}</h1>
            {category.description && (
              <p className="text-lg text-white/90">{category.description}</p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Suspense
            fallback={
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Loading trips...</p>
              </div>
            }
          >
            <CategoryTripsContent
              categoryId={categoryId}
              searchParams={searchParams}
            />
          </Suspense>

          {/* Explore Other Categories Section */}
          {otherCategories.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Explore other categories
              </h2>
              <div className="flex flex-wrap gap-3">
                {otherCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/discover/${cat.id}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

