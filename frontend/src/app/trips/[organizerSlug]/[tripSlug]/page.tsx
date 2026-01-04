import { notFound } from "next/navigation";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { TripDetailHero } from "@/src/components/trips/TripDetailHero";
import { BookingCard } from "@/src/components/trips/BookingCard";
import { getTripBySlug } from "@/src/lib/api/trips";

function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startFormatted = start.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const endFormatted = end.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${startFormatted} – ${endFormatted}`;
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ organizerSlug: string; tripSlug: string }>;
}) {
  const { tripSlug } = await params;
  const trip = await getTripBySlug(tripSlug);

  if (!trip) {
    notFound();
  }

  const dateRange = formatDateRange(trip.start_date, trip.end_date);
  const duration = calculateDuration(trip.start_date, trip.end_date);
  const groupSize = `Max ${trip.total_seats} people`;

  // For now, we don't have highlights from backend
  const highlights: string[] = [];
  const itinerary: Array<{ day: number; title: string; description: string }> =
    trip.itinerary || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <TripDetailHero
          title={trip.title}
          location={trip.destination}
          dateRange={dateRange}
          seatsAvailable={trip.available_seats}
          tags={trip.tags}
        />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Overview Section */}
              {trip.description && (
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    About this trip
                  </h2>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {trip.description}
                    </p>
                  </div>
                </section>
              )}

              {/* Highlights Section */}
              {highlights.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Trip Highlights
                  </h2>
                  <ul className="space-y-4">
                    {highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg
                          className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700 text-lg">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Itinerary Section */}
              {itinerary.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Itinerary
                  </h2>
                  <div className="space-y-8">
                    {itinerary
                      .slice()
                      .sort((a, b) => a.day - b.day)
                      .map((item) => (
                      <div key={item.day} className="border-l-4 border-blue-600 pl-6">
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className="text-blue-600 font-bold text-lg">
                            Day {item.day}
                          </span>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!trip.description && highlights.length === 0 && itinerary.length === 0 && (
                <section>
                  <p className="text-gray-500">More details coming soon.</p>
                </section>
              )}
            </div>

            {/* Right Column - Sticky Booking Card */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <BookingCard
                  price={trip.price}
                  dateRange={dateRange}
                  duration={duration}
                  groupSize={groupSize}
                  seatsAvailable={trip.available_seats}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
