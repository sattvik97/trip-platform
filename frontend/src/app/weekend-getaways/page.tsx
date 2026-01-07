import { notFound } from "next/navigation";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { HomeTripCard } from "@/src/components/home/HomeTripCard";
import { getWeekendGetaways } from "@/src/lib/api/trips";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function WeekendGetawaysPage() {
  const trips = await getWeekendGetaways();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                This Weekend Getaways
              </h1>
              <p className="text-gray-600 text-lg">
                Discover trips starting this Friday or Saturday, ending on Sunday or Monday
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          {trips.length === 0 ? (
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
                  No weekend getaways this week
                </h3>
                <p className="text-gray-500 mb-6">
                  Check back next week for new weekend getaway trips!
                </p>
                <a
                  href="/trips"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Browse all trips →
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Found {trips.length} {trips.length === 1 ? "trip" : "trips"} for this weekend
                </p>
              </div>
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
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

