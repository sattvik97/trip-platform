import { notFound } from "next/navigation";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { TripHeroImage } from "@/src/components/trips/TripHeroImage";
import { TripImageGallery } from "@/src/components/trips/TripImageGallery";
import { RequestCard } from "@/src/components/trips/RequestCard";
import { TripBookingStatus } from "@/src/components/trips/TripBookingStatus";
import { ExpandableText } from "@/src/components/trips/ExpandableText";
import { getTripBySlug } from "@/src/lib/api/trips";
import {
  deriveTripFitNotes,
  deriveTripHighlights,
  formatPriceInr,
  formatSeatCopy,
  formatTagLabel,
  formatTripDateRange,
  formatTripDuration,
} from "@/src/lib/tripPresentation";

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

void calculateDuration;
void formatDateRange;

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  const dateRange = formatTripDateRange(trip.start_date, trip.end_date, "long");
  const duration = formatTripDuration(trip.start_date, trip.end_date);
  const groupSize = `Up to ${trip.total_seats} travelers`;
  const isArchived = trip.status === "ARCHIVED";
  const highlights = deriveTripHighlights(trip);
  const fitNotes = deriveTripFitNotes(trip);
  const itinerary: Array<{ day: number; title: string; description: string }> = trip.itinerary || [];
  const commitments = [
    "Live seat counts reflect approved payment holds and confirmed bookings.",
    "Request-based booking lets the organizer approve the right group before payment.",
    "Approved payment windows expire automatically if checkout is not completed in time.",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5efe6]">
      <Header />
      <main className="flex-grow">
        {/* Hero Image Section */}
        <TripHeroImage
          tripId={trip.id}
          title={trip.title}
          location={trip.destination}
          dateRange={dateRange}
          tags={trip.tags}
          seatsAvailable={trip.available_seats}
        />

        <div className="border-y border-[color:var(--line)] bg-white/75">
          <div className="container mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-4">
            {[
              { label: "Dates", value: dateRange },
              { label: "Duration", value: duration },
              { label: "Starting from", value: formatPriceInr(trip.price) },
              { label: "Verified seats", value: formatSeatCopy(trip.available_seats) },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] bg-[#f9f4ec] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
          {isArchived && (
            <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm leading-6 text-amber-900">
                This trip has been archived and is no longer accepting new requests. You can still explore the itinerary below.
              </p>
            </div>
          )}

          <TripBookingStatus tripId={trip.id} />
          <TripImageGallery tripId={trip.id} />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
            <div className="space-y-12 lg:col-span-2">
              <section className="grid gap-4 md:grid-cols-2">
                {highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-lg shadow-slate-950/5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                      Why this stands out
                    </p>
                    <p className="mt-3 text-lg font-semibold leading-8 text-slate-950">
                      {highlight}
                    </p>
                  </div>
                ))}
              </section>

              <section className="rounded-[2rem] border border-white/80 bg-white/80 p-7 shadow-lg shadow-slate-950/5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  About this trip
                </p>
                <h2 className="font-display text-4xl font-semibold text-slate-950">
                  A clearer picture before you request
                </h2>
                <div className="mt-5">
                  <ExpandableText
                    text={
                      trip.description ||
                      "The organizer has not added a long-form description yet, but the itinerary and live trip details below are already available."
                    }
                    maxLength={560}
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/80 bg-white/80 p-7 shadow-lg shadow-slate-950/5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Good fit if
                </p>
                <h2 className="font-display text-4xl font-semibold text-slate-950">
                  This trip matches how you like to travel
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fitNotes.map((note) => (
                    <div key={note} className="rounded-[1.5rem] bg-[#f7f1e8] p-5 text-sm leading-7 text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
                {trip.tags && trip.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {trip.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
                      >
                        {formatTagLabel(tag)}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[2rem] border border-white/80 bg-white/80 p-7 shadow-lg shadow-slate-950/5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  How booking works
                </p>
                <h2 className="font-display text-4xl font-semibold text-slate-950">
                  Honest, request-based booking
                </h2>
                <div className="mt-6 space-y-4">
                  {commitments.map((item, index) => (
                    <div key={item} className="flex gap-4 rounded-[1.5rem] bg-[#f7f1e8] p-5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-7 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              {itinerary.length > 0 && (
                <section className="rounded-[2rem] border border-white/80 bg-white/80 p-7 shadow-lg shadow-slate-950/5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Itinerary
                  </p>
                  <h2 className="font-display text-4xl font-semibold text-slate-950">
                    The trip flow, day by day
                  </h2>
                  <div className="mt-8 space-y-5">
                    {itinerary
                      .slice()
                      .sort((a, b) => a.day - b.day)
                      .map((item) => (
                        <div
                          key={item.day}
                          className="rounded-[1.75rem] border border-slate-200 bg-white p-6"
                        >
                          <div className="mb-3 flex items-baseline gap-4">
                            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                              Day {item.day}
                            </span>
                            <h3 className="text-2xl font-semibold text-slate-950">{item.title}</h3>
                          </div>
                          <p className="text-base leading-8 text-slate-700">{item.description}</p>
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="space-y-6 lg:sticky lg:top-24">
                <RequestCard
                  tripId={trip.id}
                  tripSlug={trip.slug}
                  price={trip.price}
                  dateRange={dateRange}
                  duration={duration}
                  groupSize={groupSize}
                  seatsAvailable={trip.available_seats}
                  status={trip.status}
                />

                <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-lg shadow-slate-950/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    What to expect
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    <p>This is an organizer-owned trip, so the person reviewing your request is accountable for the experience.</p>
                    <p>Availability is derived from approved payment holds and confirmed bookings, which keeps the seat count more trustworthy than a hand-updated counter.</p>
                    <p>If this trip is right for you, requesting early gives the organizer more time to review and confirm your place.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

