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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Bookings</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track reservation state and payment progress in one place.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Loading your bookings...
          </div>
        ) : bookingRows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">No bookings yet.</p>
            <Link
              href="/trips"
              className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Explore Trips
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingRows.map(({ booking, latestPaymentStatus }) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}/confirmation`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {booking.trip_title || "Trip"}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {booking.trip_destination || "Destination unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Booked on {formatDate(booking.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <BookingStatusBadge status={booking.status} />
                    <PaymentStatusBadge status={latestPaymentStatus} />
                    {normalizeBookingStatus(booking.status) === "PENDING" && (
                      <ExpiryCountdown status={booking.status} expiresAt={booking.expires_at} />
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Seats</p>
                    <p className="font-semibold">{booking.seats_booked}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                    <p className="font-semibold">{normalizeBookingStatus(booking.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Payment</p>
                    <p className="font-semibold">{String(latestPaymentStatus).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Travelers</p>
                    <p className="font-semibold">{booking.num_travelers || booking.seats_booked}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
