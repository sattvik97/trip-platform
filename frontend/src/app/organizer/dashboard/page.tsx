"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveBooking,
  archiveTrip,
  getOrganizerBookings,
  getOrganizerTrips,
  OrganizerBooking,
  OrganizerTrip,
  publishTrip,
  rejectBooking,
  unarchiveTrip,
} from "@/src/lib/api/organizer";
import { getTripImages } from "@/src/lib/api/trip-images";
import { listPaymentsByBookingIds, PaymentAttempt } from "@/src/lib/api/payments";
import {
  formatAmount,
  formatDateTime,
  latestPaymentAttempt,
  normalizeBookingStatus,
  paymentStatusClass,
} from "@/src/lib/bookingFinance";
import { getToken } from "@/src/lib/auth";
import { useAuth } from "@/src/contexts/AuthContext";

const PAGE_SIZE = 10;
const PAYMENT_STATUS_FILTERS = [
  "",
  "SUCCESS",
  "FAILED",
  "PENDING",
  "ORDER_CREATED",
  "REFUNDED",
  "NOT_INITIATED",
] as const;

function formatTripDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function paymentBadge(status: string) {
  const normalized = String(status || "NOT_INITIATED").toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(
        normalized
      )}`}
    >
      {normalized}
    </span>
  );
}

function bookingBadge(status: string) {
  const normalized = normalizeBookingStatus(status);
  const styleMap: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
    EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styleMap[normalized] || styleMap.PENDING
      }`}
    >
      {normalized}
    </span>
  );
}

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [trips, setTrips] = useState<OrganizerTrip[]>([]);
  const [bookings, setBookings] = useState<OrganizerBooking[]>([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState<Record<string, PaymentAttempt[]>>({});
  const [imageCounts, setImageCounts] = useState<Record<string, number>>({});
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "ongoing" | "past" | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const loadImageCounts = async (tripData: OrganizerTrip[]) => {
    const counts: Record<string, number> = {};
    await Promise.all(
      tripData.map(async (trip) => {
        try {
          const images = await getTripImages(trip.id);
          counts[trip.id] = images.length;
        } catch {
          counts[trip.id] = 0;
        }
      })
    );
    setImageCounts(counts);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [tripData, bookingData] = await Promise.all([
          getOrganizerTrips(timeFilter),
          getOrganizerBookings(""),
        ]);

        setTrips(tripData);
        setBookings(bookingData);
        await loadImageCounts(tripData);

        const paymentMap = await listPaymentsByBookingIds(bookingData.map((b) => b.id));
        setPaymentsByBooking(paymentMap);
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/organizer/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load organizer dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [router, timeFilter]);

  const refreshBookingsAndPayments = async () => {
    setIsMutating(true);
    setError("");
    try {
      const bookingData = await getOrganizerBookings("");
      setBookings(bookingData);
      const paymentMap = await listPaymentsByBookingIds(bookingData.map((b) => b.id));
      setPaymentsByBooking(paymentMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh bookings");
    } finally {
      setIsMutating(false);
    }
  };

  const refreshTrips = async () => {
    try {
      const data = await getOrganizerTrips(timeFilter);
      setTrips(data);
      await loadImageCounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh trips");
    }
  };

  const handleApprove = async (bookingId: string) => {
    setIsMutating(true);
    setError("");
    try {
      await approveBooking(bookingId);
      await refreshBookingsAndPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve booking");
    } finally {
      setIsMutating(false);
    }
  };

  const handleReject = async (bookingId: string) => {
    setIsMutating(true);
    setError("");
    try {
      await rejectBooking(bookingId);
      await refreshBookingsAndPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject booking");
    } finally {
      setIsMutating(false);
    }
  };

  const handlePublishTrip = async (tripId: string) => {
    setError("");
    try {
      await publishTrip(tripId);
      await refreshTrips();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish trip";
      setError(message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleArchiveTrip = async (tripId: string) => {
    setError("");
    try {
      await archiveTrip(tripId);
      await refreshTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive trip");
    }
  };

  const handleUnarchiveTrip = async (tripId: string) => {
    setError("");
    try {
      await unarchiveTrip(tripId);
      await refreshTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unarchive trip");
    }
  };

  const latestPaymentByBooking = useMemo(() => {
    return Object.entries(paymentsByBooking).reduce<Record<string, PaymentAttempt | null>>(
      (acc, [bookingId, attempts]) => {
        acc[bookingId] = latestPaymentAttempt(attempts);
        return acc;
      },
      {}
    );
  }, [paymentsByBooking]);

  const allPayments = useMemo(
    () => Object.values(paymentsByBooking).flat(),
    [paymentsByBooking]
  );

  const analytics = useMemo(() => {
    const revenue = allPayments
      .filter((payment) => String(payment.status).toUpperCase() === "SUCCESS")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const pendingBookings = bookings.filter(
      (booking) => normalizeBookingStatus(booking.status) === "PENDING"
    ).length;

    const failedPaymentsCount = allPayments.filter(
      (payment) => String(payment.status).toUpperCase() === "FAILED"
    ).length;

    const publishedTrips = trips.filter((t) => t.status === "PUBLISHED").length;
    const confirmedTravelers = bookings
      .filter((b) => normalizeBookingStatus(b.status) === "CONFIRMED")
      .reduce((sum, b) => sum + (b.num_travelers || b.seats_booked || 0), 0);

    return {
      revenue,
      pendingBookings,
      failedPaymentsCount,
      totalBookings: bookings.length,
      totalTrips: trips.length,
      publishedTrips,
      confirmedTravelers,
    };
  }, [allPayments, bookings, trips]);

  const filteredBookings = useMemo(() => {
    if (!paymentStatusFilter) {
      return bookings;
    }
    return bookings.filter((booking) => {
      const latestPayment = latestPaymentByBooking[booking.id];
      const latestStatus = String(latestPayment?.status || "NOT_INITIATED").toUpperCase();
      return latestStatus === paymentStatusFilter;
    });
  }, [bookings, latestPaymentByBooking, paymentStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredBookings]);

  useEffect(() => {
    setPage(1);
  }, [paymentStatusFilter]);

  const pendingBookingRows = useMemo(
    () =>
      bookings.filter((booking) => normalizeBookingStatus(booking.status) === "PENDING").slice(0, 4),
    [bookings]
  );

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center text-sm text-slate-500">
        Loading organizer dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organizer Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage trips, review bookings, and track payments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/payments"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Admin Payments
            </Link>
            <Link
              href="/organizer/trips/create"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create Trip
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Revenue</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatAmount(analytics.revenue, "INR")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Published trips</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.publishedTrips}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending bookings</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.pendingBookings}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Failed payments</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.failedPaymentsCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confirmed travelers</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.confirmedTravelers}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total bookings</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.totalBookings}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Trips (filter)</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.totalTrips}</p>
          </article>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Pending booking queue</h2>
            {isMutating && <span className="text-xs text-slate-500">Updating...</span>}
          </div>
          {pendingBookingRows.length === 0 ? (
            <p className="text-sm text-slate-600">No pending bookings.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pendingBookingRows.map((booking) => (
                <article key={booking.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{booking.trip_title || "Unknown Trip"}</p>
                  <p className="text-sm text-slate-600">
                    {booking.user_email || "Unknown user"} | Seats:{" "}
                    {booking.num_travelers || booking.seats_booked}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApprove(booking.id)}
                      disabled={isMutating}
                      className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(booking.id)}
                      disabled={isMutating}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Trip lifecycle: restored from pre-payment dashboard */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your trips</h2>
              <p className="text-xs text-slate-500">
                Filter by time, edit drafts, publish (requires at least one image), archive or unarchive.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: undefined as "upcoming" | "ongoing" | "past" | undefined, label: "All" },
                { key: "upcoming" as const, label: "Upcoming" },
                { key: "ongoing" as const, label: "Ongoing" },
                { key: "past" as const, label: "Past" },
              ].map(({ key, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTimeFilter(key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    timeFilter === key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {trips.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No trips match this filter. Create a trip or choose another filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Trip", "Dates", "Status", "Seats", "Price", "Actions"].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {trips.map((trip) => {
                    const isDraft = trip.status === "DRAFT";
                    const isPublished = trip.status === "PUBLISHED";
                    const isArchived = trip.status === "ARCHIVED";
                    const imageCount = imageCounts[trip.id] || 0;
                    const canPublish = isDraft && imageCount > 0;

                    return (
                      <tr key={trip.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">{trip.title}</div>
                          <div className="text-sm text-slate-500">{trip.destination}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatTripDate(trip.start_date)} – {formatTripDate(trip.end_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              isPublished
                                ? "bg-sky-100 text-sky-800"
                                : isArchived
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {trip.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {trip.total_seats}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatAmount(trip.price, "INR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={!isDraft}
                              title={
                                isDraft
                                  ? "Edit trip details"
                                  : "Editing is only allowed while the trip is in DRAFT"
                              }
                              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                                isDraft
                                  ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                                  : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              }`}
                              onClick={() => {
                                if (isDraft) {
                                  router.push(`/organizer/trips/${trip.id}/edit`);
                                }
                              }}
                            >
                              Edit
                            </button>

                            {isDraft && (
                              <div className="flex flex-col items-start gap-1">
                                <button
                                  type="button"
                                  onClick={() => void handlePublishTrip(trip.id)}
                                  disabled={!canPublish}
                                  title={
                                    canPublish
                                      ? "Publish this trip"
                                      : "Add at least one image to publish this trip"
                                  }
                                  className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                                    canPublish ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-slate-300"
                                  }`}
                                >
                                  Publish
                                </button>
                                {imageCount === 0 && (
                                  <span className="text-xs text-slate-500">Add an image to publish</span>
                                )}
                              </div>
                            )}
                            {isPublished && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/trip/${trip.slug}`)}
                                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleArchiveTrip(trip.id)}
                                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Archive
                                </button>
                              </>
                            )}
                            {isArchived && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/trip/${trip.slug}`)}
                                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleUnarchiveTrip(trip.id)}
                                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                >
                                  Unarchive
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bookings and payments</h2>
              <p className="text-xs text-slate-500">Filter by payment status and review outcomes.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Payment status
              <select
                value={paymentStatusFilter}
                onChange={(event) => setPaymentStatusFilter(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {PAYMENT_STATUS_FILTERS.filter(Boolean).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Trip",
                    "Traveler",
                    "Seats",
                    "Booking",
                    "Payment",
                    "Amount",
                    "Attempts",
                    "Booked at",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedBookings.map((booking) => {
                  const attempts = paymentsByBooking[booking.id] || [];
                  const latest = latestPaymentByBooking[booking.id];
                  const latestStatus = String(latest?.status || "NOT_INITIATED").toUpperCase();
                  const amount = latest?.amount || booking.total_price || booking.amount_snapshot || 0;
                  const currency = latest?.currency || booking.currency || "INR";
                  const normalizedBooking = normalizeBookingStatus(booking.status);

                  return (
                    <tr key={booking.id}>
                      <td className="px-4 py-3 text-sm text-slate-900">{booking.trip_title || "Unknown Trip"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{booking.user_email || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {booking.num_travelers || booking.seats_booked}
                      </td>
                      <td className="px-4 py-3 text-sm">{bookingBadge(normalizedBooking)}</td>
                      <td className="px-4 py-3 text-sm">{paymentBadge(latestStatus)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(amount, currency)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{attempts.length}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(booking.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        {normalizedBooking === "PENDING" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void handleApprove(booking.id)}
                              disabled={isMutating}
                              className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReject(booking.id)}
                              disabled={isMutating}
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No bookings found for the selected payment filter.
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
              <p className="text-slate-600">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-slate-700">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
