"use client";

import Link from "next/link";
import { UserBooking } from "@/src/lib/api/user";
import { normalizeBookingStatus } from "@/src/lib/bookingFinance";

interface BookingStatusBannerProps {
  booking: UserBooking;
}

const MESSAGES: Record<string, { title: string; body: string; tone: string }> = {
  REVIEW_PENDING: {
    title: "Your request is under review",
    body: "The organizer still needs to approve this request before payment starts.",
    tone: "amber",
  },
  PAYMENT_PENDING: {
    title: "Your payment window is active",
    body: "Complete payment before the timer ends to lock in your spot.",
    tone: "sky",
  },
  CONFIRMED: {
    title: "Your spot is confirmed",
    body: "Payment is complete and your trip slot is secured.",
    tone: "emerald",
  },
  EXPIRED: {
    title: "Booking expired",
    body: "The hold window ended before payment was completed.",
    tone: "slate",
  },
  CANCELLED: {
    title: "Booking cancelled",
    body: "This booking was cancelled or not approved. You can explore a new trip any time.",
    tone: "rose",
  },
};

const TONE_CLASSES: Record<string, string> = {
  amber: "border-amber-300 bg-amber-50 text-amber-900",
  sky: "border-sky-300 bg-sky-50 text-sky-900",
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-900",
  slate: "border-slate-300 bg-slate-50 text-slate-900",
  rose: "border-rose-300 bg-rose-50 text-rose-900",
};

export function BookingStatusBanner({ booking }: BookingStatusBannerProps) {
  const status = normalizeBookingStatus(booking.status);
  const meta = MESSAGES[status] || MESSAGES.REVIEW_PENDING;
  const toneClass = TONE_CLASSES[meta.tone] || TONE_CLASSES.amber;

  return (
    <div className={`mb-6 rounded-xl border p-4 ${toneClass}`}>
      <h3 className="text-sm font-semibold">{meta.title}</h3>
      <p className="mt-1 text-sm opacity-90">{meta.body}</p>
      <Link
        href={`/bookings/${booking.id}/confirmation`}
        className="mt-3 inline-flex text-sm font-semibold underline"
      >
        View booking details
      </Link>
    </div>
  );
}
