"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Footer } from "@/src/components/layout/Footer";
import { Header } from "@/src/components/layout/Header";
import { ExpiryCountdown } from "@/src/components/payments/ExpiryCountdown";
import { PaymentAttemptsList } from "@/src/components/payments/PaymentAttemptsList";
import { BookingStatusBadge, PaymentStatusBadge } from "@/src/components/payments/StatusBadges";
import { useBookingPayments } from "@/src/hooks/useBookingPayments";
import {
  canCompletePaymentVerify,
  canInitiatePaymentAttempt,
  formatAmount,
  formatDateTime,
  normalizeBookingStatus,
} from "@/src/lib/bookingFinance";
import { getUserBooking, UserBooking } from "@/src/lib/api/user";
import { verifyPayment } from "@/src/lib/api/payments";
import { useAuth } from "@/src/contexts/AuthContext";

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) {
    return "-";
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function calculateBookingAmount(booking: UserBooking): number {
  if (typeof booking.total_price === "number") {
    return booking.total_price;
  }
  if (typeof booking.amount_snapshot === "number") {
    return booking.amount_snapshot;
  }
  if (typeof booking.price_per_person === "number") {
    const seats = booking.num_travelers || booking.seats_booked || 0;
    return seats * booking.price_per_person;
  }
  return 0;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, role } = useAuth();
  const bookingId = (params?.booking_id as string) || "";

  const [booking, setBooking] = useState<UserBooking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [error, setError] = useState("");
  const [retryMessage, setRetryMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    attempts,
    latestAttempt,
    isLoading: isLoadingPayments,
    isRetrying,
    error: paymentError,
    retryPayment,
    refresh,
  } = useBookingPayments({
    bookingId,
    enabled: Boolean(bookingId && isAuthenticated && role === "user"),
    autoRefreshMs: 15000,
  });

  useEffect(() => {
    if (!isAuthenticated || role !== "user") {
      router.push("/user/login");
      return;
    }

    const fetchBooking = async () => {
      setIsLoadingBooking(true);
      setError("");
      try {
        const bookingData = await getUserBooking(bookingId);
        setBooking(bookingData);
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/user/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load booking");
      } finally {
        setIsLoadingBooking(false);
      }
    };

    if (bookingId) {
      void fetchBooking();
    }
  }, [bookingId, isAuthenticated, role, router]);

  const normalizedBookingStatus = normalizeBookingStatus(booking?.status || "PENDING");
  const latestPaymentStatus = String(latestAttempt?.status || "NOT_INITIATED").toUpperCase();
  const bookingAmount = booking ? calculateBookingAmount(booking) : 0;
  const bookingCurrency = booking?.currency || "INR";

  const payNowEnabled = useMemo(() => {
    if (!booking) {
      return false;
    }
    return canInitiatePaymentAttempt({
      bookingStatus: booking.status,
      expiresAt: booking.expires_at,
      latestPaymentStatus,
    });
  }, [booking, latestPaymentStatus]);

  const verifyEnabled = useMemo(() => {
    if (!booking) {
      return false;
    }
    return canCompletePaymentVerify({
      bookingStatus: booking.status,
      expiresAt: booking.expires_at,
      latestPaymentStatus,
    });
  }, [booking, latestPaymentStatus]);

  const payDisabledReason = useMemo(() => {
    if (!booking) {
      return "Booking unavailable";
    }
    if (normalizedBookingStatus === "CONFIRMED") {
      return "Payment completed";
    }
    if (normalizedBookingStatus === "EXPIRED") {
      return "Booking expired";
    }
    if (normalizedBookingStatus === "CANCELLED") {
      return "Booking cancelled";
    }
    if (!payNowEnabled && !verifyEnabled) {
      return "Complete or retry payment when your booking is pending";
    }
    return "";
  }, [booking, latestPaymentStatus, normalizedBookingStatus, payNowEnabled, verifyEnabled]);

  const handlePayOrRetry = async () => {
    setRetryMessage("");
    try {
      const response = await retryPayment();
      setRetryMessage(`New payment attempt created: ${response.order.order_id}`);
      await refresh();
    } catch {
      // Error is already set by hook.
    }
  };

  const handleVerifyPayment = async () => {
    if (!latestAttempt) {
      return;
    }
    setRetryMessage("");
    setIsVerifying(true);
    try {
      await verifyPayment({ payment_id: latestAttempt.id });
      setRetryMessage("Payment verified successfully.");
      await refresh();
      const bookingData = await getUserBooking(bookingId);
      setBooking(bookingData);
    } catch (err) {
      setRetryMessage(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAuthenticated || role !== "user") {
    return null;
  }

  if (isLoadingBooking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-slate-500">
          Loading booking details...
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-xl font-bold text-rose-900">Unable to load booking</h1>
            <p className="mt-2 text-sm text-rose-800">{error || "Booking not found"}</p>
            <Link
              href="/account/bookings"
              className="mt-4 inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Back to My Bookings
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-[1.65fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {booking.trip_title || "Trip Booking"}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {booking.trip_destination || "Destination unavailable"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BookingStatusBadge status={booking.status} />
                <PaymentStatusBadge status={latestPaymentStatus} />
                <ExpiryCountdown status={booking.status} expiresAt={booking.expires_at} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Booking ID</p>
                <p className="font-medium text-slate-900">{booking.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Travelers</p>
                <p className="font-medium text-slate-900">{booking.num_travelers || booking.seats_booked}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Trip Dates</p>
                <p className="font-medium text-slate-900">
                  {formatDateRange(booking.trip_start_date, booking.trip_end_date)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Booked At</p>
                <p className="font-medium text-slate-900">{formatDateTime(booking.created_at)}</p>
              </div>
            </div>
          </div>

          <PaymentAttemptsList
            attempts={attempts}
            isLoading={isLoadingPayments}
            emptyState="No payment attempts created for this booking yet."
          />
        </section>

        <aside className="space-y-4">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Checkout</h2>
            <p className="mt-1 text-sm text-slate-600">
              Keep this booking active and complete payment before expiry.
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Payable</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatAmount(bookingAmount, bookingCurrency)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Latest payment status: <span className="font-semibold">{latestPaymentStatus}</span>
              </p>
            </div>

            {verifyEnabled && latestAttempt && (
              <button
                type="button"
                onClick={() => void handleVerifyPayment()}
                disabled={isVerifying || isRetrying}
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isVerifying ? "Confirming payment..." : "Complete payment"}
              </button>
            )}

            {payNowEnabled && (
              <button
                type="button"
                onClick={() => void handlePayOrRetry()}
                disabled={isRetrying || isVerifying}
                className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${
                  verifyEnabled ? "bg-slate-600 hover:bg-slate-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isRetrying
                  ? "Starting payment..."
                  : String(latestPaymentStatus || "").toUpperCase() === "FAILED"
                    ? "Retry payment"
                    : "Pay now"}
              </button>
            )}
            {!payNowEnabled && !verifyEnabled && (
              <p className="mt-2 text-xs text-slate-500">{payDisabledReason}</p>
            )}

            {retryMessage && (
              <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
                {retryMessage}
              </p>
            )}
            {paymentError && (
              <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                {paymentError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/account/bookings"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to My Bookings
              </Link>
              <Link
                href="/trips"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Explore More Trips
              </Link>
            </div>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
