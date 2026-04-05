"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCountdown, isBookingExpired, normalizeBookingStatus } from "@/src/lib/bookingFinance";

interface ExpiryCountdownProps {
  status: string;
  expiresAt?: string | null;
  className?: string;
}

function getMsRemaining(expiresAt?: string | null, nowTs = Date.now()): number {
  if (!expiresAt) {
    return 0;
  }
  const expiresTs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresTs)) {
    return 0;
  }
  return Math.max(expiresTs - nowTs, 0);
}

export function ExpiryCountdown({ status, expiresAt, className = "" }: ExpiryCountdownProps) {
  const normalizedStatus = normalizeBookingStatus(status);
  const [now, setNow] = useState(() => Date.now());
  const msRemaining = useMemo(() => getMsRemaining(expiresAt, now), [expiresAt, now]);

  useEffect(() => {
    if (!expiresAt || normalizedStatus !== "PAYMENT_PENDING") {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, normalizedStatus]);

  const label = useMemo(() => {
    if (!expiresAt) {
      return normalizedStatus === "REVIEW_PENDING" ? "Awaiting approval" : "No expiry window";
    }
    if (normalizedStatus !== "PAYMENT_PENDING") {
      return normalizedStatus === "CONFIRMED" ? "Booking confirmed" : "Booking closed";
    }
    if (isBookingExpired(status, expiresAt) || msRemaining <= 0) {
      return "Expired";
    }
    return `Expires in ${formatCountdown(msRemaining)}`;
  }, [expiresAt, msRemaining, normalizedStatus, status]);

  const colorClass =
    normalizedStatus !== "PAYMENT_PENDING"
      ? "bg-slate-100 text-slate-700 border-slate-200"
      : msRemaining <= 60_000
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${colorClass} ${className}`}>
      {label}
    </span>
  );
}
