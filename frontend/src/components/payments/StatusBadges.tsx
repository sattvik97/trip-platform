"use client";

import { bookingStatusClass, normalizeBookingStatus, paymentStatusClass } from "@/src/lib/bookingFinance";

interface BookingStatusBadgeProps {
  status: string;
  className?: string;
}

interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

export function BookingStatusBadge({ status, className = "" }: BookingStatusBadgeProps) {
  const normalized = normalizeBookingStatus(status);
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusClass(normalized)} ${className}`}>
      {normalized}
    </span>
  );
}

export function PaymentStatusBadge({ status, className = "" }: PaymentStatusBadgeProps) {
  const normalized = String(status || "NOT_INITIATED").toUpperCase();
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusClass(normalized)} ${className}`}>
      {normalized}
    </span>
  );
}
