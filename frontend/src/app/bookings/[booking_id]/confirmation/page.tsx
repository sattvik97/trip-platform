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
      router.push(`/login?next=${encodeURIComponent(`/bookings/${bookingId}/confirmation`)}`);
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
          router.push(`/login?next=${encodeURIComponent(`/bookings/${bookingId}/confirmation`)}`);
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

  const normalizedBookingStatus = normalizeBookingStatus(booking?.status || "REVIEW_PENDING");
  const latestPaymentStatus = String(latestAttempt?.status || "NOT_INITIATED").toUpperCase();
  const paymentStatusDisplay =
    normalizedBookingStatus === "REVIEW_PENDING" ? "AWAITING_APPROVAL" : latestPaymentStatus;
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
    if (normalizedBookingStatus === "REVIEW_PENDING") {
      return "Payment will unlock after the organizer approves your request";
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
  }, [booking, normalizedBookingStatus, payNowEnabled, verifyEnabled]);

  const handlePayOrRetry = async () => {
    setRetryMessage("");
    try {
      const response = await retryPayment();
      setRetryMessage(`New payment attempt created: ${response.order.order_id}`);
      await refresh();
    } catch {
      // Error is already set by the hook.
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
      <div className="min-h-screen flex flex-col bg-[#f5efe6]">
        <Header />
        <main className="flex-grow flex items-center justify-center text-sm text-slate-500">
          Loading booking details...
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5efe6]">
        <Header />
        <main className="flex-grow">
          <div className="mx-auto max-w-4xl px-4 py-12">
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
              <h1 className="text-xl font-bold text-rose-900">Unable to load booking</h1>
              <p className="mt-2 text-sm text-rose-800">{error || "Booking not found"}</p>
              <Link
                href="/account/bookings"
                className="mt-4 inline-flex rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Back to my bookings
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  let statusTitle = "Your booking is still active";
  let statusMessage = verifyEnabled
    ? "Complete the current payment step to keep this booking moving."
    : "Track organizer decisions, payment progress, and booking timing from here.";

  if (normalizedBookingStatus === "CONFIRMED") {
    statusTitle = "Your spot is confirmed";
    statusMessage = "Payment and booking details are in sync, and your place is locked in.";
  } else if (normalizedBookingStatus === "REVIEW_PENDING") {
    statusTitle = "Your request is under review";
    statusMessage = "The organizer still needs to approve this request before payment starts.";
  } else if (normalizedBookingStatus === "PAYMENT_PENDING") {
    statusTitle = "Your payment window is active";
    statusMessage = "Complete payment before the hold window ends to keep this seat reserved.";
  } else if (normalizedBookingStatus === "EXPIRED") {
    statusTitle = "This booking expired";
    statusMessage = "The hold window ended before checkout was completed.";
  } else if (normalizedBookingStatus === "CANCELLED") {
    statusTitle = "This booking has an update";
    statusMessage = "This request was cancelled or not approved. You can review the details below.";
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5efe6]">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-lg shadow-slate-950/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Booking hub
                </p>
                <h1 className="font-display text-4xl font-semibold text-slate-950">{statusTitle}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{statusMessage}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BookingStatusBadge status={booking.status} />
                {normalizedBookingStatus !== "REVIEW_PENDING" && (
                  <PaymentStatusBadge status={latestPaymentStatus} />
                )}
                <ExpiryCountdown status={booking.status} expiresAt={booking.expires_at} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
            <section className="space-y-6">
              <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">
                      {booking.trip_title || "Trip booking"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {booking.trip_destination || "Destination unavailable"}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">Booked {formatDateTime(booking.created_at)}</p>
                </div>

                <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Booking ID</p>
                    <p className="mt-1 font-medium text-slate-900">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Travelers</p>
                    <p className="mt-1 font-medium text-slate-900">{booking.num_travelers || booking.seats_booked}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Trip dates</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateRange(booking.trip_start_date, booking.trip_end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Contact</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {booking.contact_email || booking.user_email || "Unavailable"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5">
                <h3 className="text-xl font-semibold text-slate-950">Booking summary</h3>
                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Amount due</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {formatAmount(bookingAmount, bookingCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Latest payment</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{paymentStatusDisplay}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Primary contact</p>
                    <p className="mt-1 font-medium text-slate-900">{booking.contact_name || "-"}</p>
                    <p className="text-slate-500">{booking.contact_phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Status detail</p>
                    <p className="mt-1 font-medium text-slate-900">{normalizedBookingStatus}</p>
                  </div>
                </div>

                {booking.traveler_details && booking.traveler_details.length > 0 && (
                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <p className="text-sm font-medium text-slate-700">Travelers</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {booking.traveler_details.map((traveler, index) => (
                        <div key={`${traveler.name}-${index}`} className="rounded-xl bg-[#f7f1e8] p-4">
                          <p className="font-medium text-slate-950">{traveler.name}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {traveler.age} yrs / {traveler.gender}
                          </p>
                          {traveler.profession && (
                            <p className="mt-1 text-sm text-slate-500">{traveler.profession}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <PaymentAttemptsList
                attempts={attempts}
                isLoading={isLoadingPayments}
                emptyState="No payment attempts created for this booking yet."
              />
            </section>

            <aside className="space-y-4">
              <div className="sticky top-24 rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5">
                <h2 className="text-lg font-semibold text-slate-950">Checkout</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {normalizedBookingStatus === "REVIEW_PENDING"
                    ? "Payment stays locked until the organizer approves your request."
                    : "Keep this booking active and complete payment before the hold window ends."}
                </p>

                <div className="mt-5 rounded-2xl bg-[#f7f1e8] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total payable</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {formatAmount(bookingAmount, bookingCurrency)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Latest payment status: <span className="font-semibold">{paymentStatusDisplay}</span>
                  </p>
                </div>

                {verifyEnabled && latestAttempt && (
                  <button
                    type="button"
                    onClick={() => void handleVerifyPayment()}
                    disabled={isVerifying || isRetrying}
                    className="mt-4 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {isVerifying ? "Confirming payment..." : "Complete payment"}
                  </button>
                )}

                {payNowEnabled && (
                  <button
                    type="button"
                    onClick={() => void handlePayOrRetry()}
                    disabled={isRetrying || isVerifying}
                    className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${
                      verifyEnabled ? "bg-slate-700 hover:bg-slate-800" : "bg-slate-950 hover:bg-slate-800"
                    }`}
                  >
                    {isRetrying
                      ? "Starting payment..."
                      : latestPaymentStatus === "FAILED"
                        ? "Retry payment"
                        : "Pay now"}
                  </button>
                )}

                {!payNowEnabled && !verifyEnabled && (
                  <p className="mt-3 text-xs text-slate-500">{payDisabledReason}</p>
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
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Open booking hub
                  </Link>
                  <Link
                    href="/discover"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-950 hover:text-slate-950"
                  >
                    Explore more trips
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
