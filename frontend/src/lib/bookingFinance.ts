import type { PaymentAttempt, PaymentStatus } from "./api/payments";

export type BookingStatus =
  | "REVIEW_PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | string;

export function normalizeBookingStatus(status: string | null | undefined): BookingStatus {
  const normalized = (status || "").toUpperCase();
  if (normalized === "APPROVED") {
    return "PAYMENT_PENDING";
  }
  if (normalized === "PENDING") {
    return "PAYMENT_PENDING";
  }
  if (normalized === "REJECTED") {
    return "CANCELLED";
  }
  if (!normalized) {
    return "REVIEW_PENDING";
  }
  return normalized;
}

export function bookingStatusClass(status: BookingStatus): string {
  switch (normalizeBookingStatus(status)) {
    case "REVIEW_PENDING":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "PAYMENT_PENDING":
      return "bg-sky-100 text-sky-800 border border-sky-200";
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "EXPIRED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "CANCELLED":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    default:
      return "bg-amber-100 text-amber-800 border border-amber-200";
  }
}

export function paymentStatusClass(status: PaymentStatus | string): string {
  const normalized = String(status || "").toUpperCase();
  switch (normalized) {
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "FAILED":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    case "REFUNDED":
      return "bg-violet-100 text-violet-800 border border-violet-200";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "ORDER_CREATED":
      return "bg-sky-100 text-sky-800 border border-sky-200";
    case "NOT_INITIATED":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export function formatAmount(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return "-";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function latestPaymentAttempt(attempts: PaymentAttempt[]): PaymentAttempt | null {
  if (attempts.length === 0) {
    return null;
  }
  return [...attempts].sort((a, b) => {
    const aTs = new Date(a.created_at).getTime();
    const bTs = new Date(b.created_at).getTime();
    return bTs - aTs;
  })[0] || null;
}

export function isBookingExpired(status: string, expiresAt?: string | null): boolean {
  if (normalizeBookingStatus(status) === "EXPIRED") {
    return true;
  }
  if (!expiresAt) {
    return false;
  }
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) {
    return false;
  }
  return Date.now() >= expires;
}

/** Create a new provider order (first payment or after a failed attempt). */
export function canInitiatePaymentAttempt(params: {
  bookingStatus: string;
  expiresAt?: string | null;
  latestPaymentStatus?: string | null;
}): boolean {
  const normalizedBookingStatus = normalizeBookingStatus(params.bookingStatus);
  if (normalizedBookingStatus !== "PAYMENT_PENDING") {
    return false;
  }
  if (isBookingExpired(normalizedBookingStatus, params.expiresAt)) {
    return false;
  }
  const s = String(params.latestPaymentStatus || "").toUpperCase();
  if (!s || s === "NOT_INITIATED") {
    return true;
  }
  return s === "FAILED";
}

/** Confirm an existing order (e.g. mock / client-side verify after checkout UI). */
export function canCompletePaymentVerify(params: {
  bookingStatus: string;
  expiresAt?: string | null;
  latestPaymentStatus?: string | null;
}): boolean {
  const normalizedBookingStatus = normalizeBookingStatus(params.bookingStatus);
  if (normalizedBookingStatus !== "PAYMENT_PENDING") {
    return false;
  }
  if (isBookingExpired(normalizedBookingStatus, params.expiresAt)) {
    return false;
  }
  const s = String(params.latestPaymentStatus || "").toUpperCase();
  return s === "ORDER_CREATED" || s === "PENDING";
}

/** @deprecated Prefer canInitiatePaymentAttempt */
export function canRetryPayment(params: {
  bookingStatus: string;
  expiresAt?: string | null;
  latestPaymentStatus?: string | null;
}): boolean {
  return canInitiatePaymentAttempt(params);
}

export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) {
    return "Expired";
  }
  const totalSeconds = Math.floor(msRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
