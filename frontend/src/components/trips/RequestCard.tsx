"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserBookingForTrip, UserBooking } from "@/src/lib/api/user";
import { useAuth } from "@/src/contexts/AuthContext";
import { normalizeBookingStatus } from "@/src/lib/bookingFinance";
import { formatPriceInr, formatSeatCopy } from "@/src/lib/tripPresentation";

interface RequestCardProps {
  tripId: string;
  tripSlug: string;
  price: number;
  dateRange: string;
  duration: string;
  groupSize: string;
  seatsAvailable: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export function RequestCard({
  tripId,
  tripSlug,
  price,
  dateRange,
  duration,
  groupSize,
  seatsAvailable,
  status,
}: RequestCardProps) {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const userLoggedIn = isAuthenticated && role === "user";
  const [booking, setBooking] = useState<UserBooking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const loginTarget = `/login?next=${encodeURIComponent(`/trip/${tripSlug}/book`)}`;

  useEffect(() => {
    if (!userLoggedIn) {
      setIsLoadingBooking(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const bookingData = await getUserBookingForTrip(tripId);
        setBooking(bookingData);
      } catch (error) {
        console.error("Failed to fetch booking:", error);
        setBooking(null);
      } finally {
        setIsLoadingBooking(false);
      }
    };

    fetchBooking();
  }, [tripId, userLoggedIn]);

  const handleBookingRequest = () => {
    if (!userLoggedIn) {
      router.push(loginTarget);
      return;
    }

    const normalized = booking ? normalizeBookingStatus(booking.status) : null;

    if (booking && normalized && ["REVIEW_PENDING", "PAYMENT_PENDING", "CONFIRMED"].includes(normalized)) {
      router.push(`/bookings/${booking.id}/confirmation`);
      return;
    }

    router.push(`/trip/${tripSlug}/book`);
  };

  const getButtonState = () => {
    if (status === "ARCHIVED") {
      return { text: "Trip archived", disabled: true };
    }
    if (status && status !== "PUBLISHED") {
      return { text: "Requests unavailable", disabled: true };
    }
    if (booking) {
      const normalized = normalizeBookingStatus(booking.status);
      if (normalized === "REVIEW_PENDING") {
        return { text: "View your request", disabled: false };
      }
      if (normalized === "PAYMENT_PENDING") {
        return { text: "Complete payment", disabled: false };
      }
      if (normalized === "CONFIRMED") {
        return { text: "View confirmed booking", disabled: false };
      }
      if (normalized === "CANCELLED" || normalized === "EXPIRED") {
        return { text: "Request again", disabled: false };
      }
    }
    if (seatsAvailable === 0) {
      return { text: "No verified seats left", disabled: true };
    }
    if (!userLoggedIn) {
      return { text: "Sign in to request", disabled: false };
    }
    return { text: "Request to join", disabled: false };
  };

  const buttonState = getButtonState();

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-slate-950/10">
      <div className="border-b border-slate-200 bg-slate-950 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          Reserve your spot
        </p>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-semibold">{formatPriceInr(price)}</span>
          <span className="pb-1 text-sm text-white/70">per traveler</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Verified seat counts come from approved payment holds and confirmed bookings, so availability here stays grounded in reality.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="rounded-[1.5rem] bg-[#f7f1e8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Live availability
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{formatSeatCopy(seatsAvailable)}</p>
          <p className="mt-1 text-sm text-slate-600">
            Approved payment holds and confirmed bookings reduce the visible seat count.
          </p>
        </div>

        <div className="space-y-4 border-b border-slate-200 pb-5">
          {[
            { label: "Dates", value: dateRange },
            { label: "Duration", value: duration },
            { label: "Group size", value: groupSize },
          ].map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="text-right text-sm font-medium text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-950">How this booking works</p>
          <div className="space-y-2 text-sm leading-6 text-slate-600">
            <p>1. You send a request with your traveler details.</p>
            <p>2. The organizer reviews fit and, if approved, opens a payment window.</p>
            <p>3. Your seat is only held once that approved payment window is active.</p>
          </div>
        </div>

        {!isLoadingBooking ? (
          <>
            <button
              type="button"
              onClick={handleBookingRequest}
              disabled={buttonState.disabled}
              className="w-full rounded-full bg-slate-950 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {buttonState.text}
            </button>
            <p className="text-center text-sm leading-6 text-slate-500">
              {userLoggedIn
                ? "No payment is collected yet. You only pay after the organizer approves your request."
                : "Sign in as a traveler to request this trip and keep your booking history in one place."}
            </p>
          </>
        ) : (
          <div className="rounded-full bg-slate-100 px-6 py-4 text-center text-slate-500">
            Loading your booking status...
          </div>
        )}
      </div>
    </div>
  );
}
