"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/src/components/layout/Footer";
import { Header } from "@/src/components/layout/Header";
import { ExpiryCountdown } from "@/src/components/payments/ExpiryCountdown";
import { BookingStatusBadge, PaymentStatusBadge } from "@/src/components/payments/StatusBadges";
import { normalizeBookingStatus } from "@/src/lib/bookingFinance";
import { listPaymentsByBookingIds, PaymentAttempt } from "@/src/lib/api/payments";
import { getUserBookings, UserBooking } from "@/src/lib/api/user";
import { useAuth } from "@/src/contexts/AuthContext";
import { formatPriceInr, formatTripDateRange } from "@/src/lib/tripPresentation";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function latestAttempt(attempts: PaymentAttempt[]): PaymentAttempt | null {
  if (attempts.length === 0) {
    return null;
  }
  return [...attempts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0] || null;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, role, user } = useAuth();

  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState<Record<string, PaymentAttempt[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || role !== "user" || !user) {
      router.push("/user/login");
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const bookingData = await getUserBookings();
        setBookings(bookingData);

        const bookingIds = bookingData.map((booking) => booking.id);
        const paymentMap = await listPaymentsByBookingIds(bookingIds);
        setPaymentsByBooking(paymentMap);
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/user/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [isAuthenticated, role, router, user]);

  const bookingRows = useMemo(() => {
    return bookings.map((booking) => {
      const attempts = paymentsByBooking[booking.id] || [];
      const latest = latestAttempt(attempts);
      return {
        booking,
        latestPaymentStatus: latest?.status || "NOT_INITIATED",
      };
    });
  }, [bookings, paymentsByBooking]);

  if (!isAuthenticated || role !== "user") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5efe6]">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8 rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Booking hub
            </p>
            <h1 className="font-display text-4xl font-semibold text-slate-950">
              All your trip requests in one place
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Track organizer decisions, payment progress, and confirmed spots without jumping between pages.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-10 text-center text-sm text-slate-500 shadow-lg shadow-slate-950/5">
              Loading your bookings...
            </div>
          ) : bookingRows.length === 0 ? (
            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-12 text-center shadow-lg shadow-slate-950/5">
              <p className="text-slate-600">You have not requested any trips yet.</p>
              <Link
                href="/discover"
                className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
              >
                Start exploring
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookingRows.map(({ booking, latestPaymentStatus }) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}/confirmation`}
                  className="block rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/8"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-semibold text-slate-950">
                          {booking.trip_title || "Trip"}
                        </h2>
                        <BookingStatusBadge status={booking.status} />
                        <PaymentStatusBadge status={latestPaymentStatus} />
                        {normalizeBookingStatus(booking.status) === "PENDING" && (
                          <ExpiryCountdown status={booking.status} expiresAt={booking.expires_at} />
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {booking.trip_destination || "Destination unavailable"}
                      </p>

                      {booking.trip_start_date && booking.trip_end_date && (
                        <p className="mt-3 text-sm text-slate-600">
                          {formatTripDateRange(booking.trip_start_date, booking.trip_end_date, "short")}
                        </p>
                      )}

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                        <span>Requested: {formatDate(booking.created_at)}</span>
                        <span>Seats: {booking.num_travelers || booking.seats_booked}</span>
                        <span>Payment: {String(latestPaymentStatus).toUpperCase()}</span>
                        <span>
                          Total: {typeof booking.total_price === "number" ? formatPriceInr(booking.total_price) : "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-medium text-slate-700">View details</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
