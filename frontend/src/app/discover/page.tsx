import Link from "next/link";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { HomeTripCard } from "@/src/components/home/HomeTripCard";
import { HOMEPAGE_CATEGORIES } from "@/src/config/categories";
import { fetchCategoryTrips } from "@/src/lib/categories";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface CategoryCardProps {
  category: typeof HOMEPAGE_CATEGORIES[0];
  trips: any[];
}

function CategoryCard({ category, trips }: CategoryCardProps) {
  const displayTrips = trips.slice(0, 3); // Show first 3 trips per category

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
        <Link
          href={`/discover/${category.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
        >
          View all →
        </Link>
      </div>

      {displayTrips.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No trips available in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayTrips.map((trip) => (
            <HomeTripCard
              key={trip.id}
              title={trip.title}
              location={trip.destination}
              date={formatDate(trip.start_date)}
              seatsAvailable={trip.available_seats}
              price={trip.price}
              imageUrl={trip.cover_image_url || undefined}
              organizerId={trip.organizer_id}
              tripSlug={trip.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function CategoriesContent() {
  // Fetch trips for all categories efficiently (deduplicates API calls)
  const categoryTripsMap = await fetchCategoryTrips(HOMEPAGE_CATEGORIES);

  return (
    <div className="space-y-8">
      {HOMEPAGE_CATEGORIES.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          trips={categoryTripsMap.get(category.id) || []}
        />
      ))}
    </div>
  );
}

export default async function DiscoverPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">
            Discover Trips
          </h1>
          <CategoriesContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}

