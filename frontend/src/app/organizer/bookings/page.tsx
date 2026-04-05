"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrganizerWorkspaceShell } from "@/src/components/organizer/OrganizerWorkspaceShell";
import {
  OrganizerBooking,
  OrganizerTrip,
  addOfflineBooking,
  approveBooking,
  bulkReviewBookings,
  getOrganizerBookings,
  getOrganizerTrips,
  rejectBooking,
} from "@/src/lib/api/organizer";
import { formatAmount, formatDateTime, normalizeBookingStatus } from "@/src/lib/bookingFinance";
import { getToken } from "@/src/lib/auth";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "REVIEW_PENDING", label: "Review pending" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

export const dynamic = "force-dynamic";

function OrganizerBookingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTripId = searchParams.get("tripId") || "";

  const [trips, setTrips] = useState<OrganizerTrip[]>([]);
  const [bookings, setBookings] = useState<OrganizerBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTripId, setSelectedTripId] = useState(initialTripId);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [offlineSeats, setOfflineSeats] = useState("1");
  const [offlineName, setOfflineName] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");
  const [offlineEmail, setOfflineEmail] = useState("");
  const [offlineNote, setOfflineNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [tripPage, bookingPage] = await Promise.all([
        getOrganizerTrips({ limit: 100 }),
        getOrganizerBookings(statusFilter, { limit: 100, trip_id: selectedTripId || undefined }),
      ]);
      setTrips(tripPage.items);
      setBookings(bookingPage.items);
    } catch (err) {
      if (err instanceof Error && err.message === "Authentication failed") {
        router.push("/organizer/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, [router, selectedTripId, statusFilter]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
      return;
    }
    void loadWorkspace();
  }, [loadWorkspace, router]);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) || null,
    [selectedTripId, trips]
  );

  const reviewableBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ["REVIEW_PENDING", "PAYMENT_PENDING"].includes(normalizeBookingStatus(booking.status))
      ),
    [bookings]
  );

  const toggleBooking = (bookingId: string) => {
    setSelectedBookingIds((current) =>
      current.includes(bookingId)
        ? current.filter((id) => id !== bookingId)
        : [...current, bookingId]
    );
  };

  const runAction = async (task: () => Promise<void>, successMessage: string) => {
    setIsMutating(true);
    setError("");
    setSuccess("");
    try {
      await task();
      setSuccess(successMessage);
      setSelectedBookingIds([]);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsMutating(false);
    }
  };

  const handleOfflineBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTripId) {
      setError("Select a trip before adding an offline booking.");
      return;
    }

    await runAction(
      async () => {
        await addOfflineBooking(selectedTripId, {
          seats: Number(offlineSeats),
          contact_name: offlineName || undefined,
          contact_phone: offlinePhone || undefined,
          contact_email: offlineEmail || undefined,
          organizer_note: offlineNote || undefined,
        });
        setOfflineSeats("1");
        setOfflineName("");
        setOfflinePhone("");
        setOfflineEmail("");
        setOfflineNote("");
      },
      "Offline booking recorded."
    );
  };

  return (
    <OrganizerWorkspaceShell
      title="Review faster, act in bulk, and keep manual bookings safe"
      description="Run your booking queue by trip or across the whole portfolio, then handle offline confirmations without breaking seat correctness."
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mb-6 grid gap-4 rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-950/5 lg:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-medium text-slate-700">
          Trip
          <select
            value={selectedTripId}
            onChange={(event) => setSelectedTripId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
          >
            <option value="">All trips</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Booking status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setSelectedTripId("");
            }}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Reset filters
          </button>
        </div>
      </div>

      {selectedBookingIds.length > 0 && (
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-[#f7f1e8] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-950">
                {selectedBookingIds.length} bookings selected
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input
                  value={bulkReason}
                  onChange={(event) => setBulkReason(event.target.value)}
                  placeholder="Reason for travelers"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                />
                <input
                  value={bulkNote}
                  onChange={(event) => setBulkNote(event.target.value)}
                  placeholder="Internal note"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() =>
                  void runAction(
                    async () => {
                      await bulkReviewBookings({
                        booking_ids: selectedBookingIds,
                        action: "approve",
                        reason: bulkReason || undefined,
                        note: bulkNote || undefined,
                      });
                    },
                    "Selected bookings approved."
                  )
                }
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Bulk approve
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() =>
                  void runAction(
                    async () => {
                      await bulkReviewBookings({
                        booking_ids: selectedBookingIds,
                        action: "reject",
                        reason: bulkReason || undefined,
                        note: bulkNote || undefined,
                      });
                    },
                    "Selected bookings rejected."
                  )
                }
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                Bulk reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Booking queue</h2>
              <p className="mt-1 text-sm text-slate-500">{bookings.length} bookings in the current workspace view.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSelectedBookingIds((current) =>
                  current.length === reviewableBookings.length ? [] : reviewableBookings.map((booking) => booking.id)
                )
              }
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
            >
              {selectedBookingIds.length === reviewableBookings.length ? "Clear selection" : "Select reviewable"}
            </button>
          </div>

          {isLoading ? (
            <div className="mt-5 rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-500">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="mt-5 rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-600">No bookings match these filters.</div>
          ) : (
            <div className="mt-5 grid gap-3">
              {bookings.map((booking) => {
                const normalizedStatus = normalizeBookingStatus(booking.status);
                const isReviewable = ["REVIEW_PENDING", "PAYMENT_PENDING"].includes(normalizedStatus);
                return (
                  <article key={booking.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.includes(booking.id)}
                          onChange={() => toggleBooking(booking.id)}
                          disabled={!isReviewable}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">{booking.trip_title || "Trip booking"}</p>
                            <span className="rounded-full bg-[#f7f1e8] px-3 py-1 text-xs font-semibold text-slate-700">
                              {normalizedStatus}
                            </span>
                            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
                              {booking.source.toUpperCase()}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {booking.contact_name || booking.user_email || "Traveler"} · {booking.num_travelers || booking.seats_booked} seats
                          </p>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span>{booking.contact_phone || "No phone"}</span>
                            <span>{booking.contact_email || booking.user_email || "No email"}</span>
                            <span>{formatDateTime(booking.created_at)}</span>
                            <span>{formatAmount(booking.total_price || booking.amount_snapshot || 0, booking.currency || "INR")}</span>
                          </div>
                          {booking.decision_reason && (
                            <p className="mt-3 text-sm text-slate-600">
                              Traveler-facing reason: {booking.decision_reason}
                            </p>
                          )}
                          {booking.organizer_note && (
                            <p className="mt-1 text-sm text-slate-500">
                              Internal note: {booking.organizer_note}
                            </p>
                          )}
                        </div>
                      </div>

                      {isReviewable && (
                        <div className="flex flex-wrap gap-2 xl:ml-auto">
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              void runAction(
                                async () => {
                                  await approveBooking(booking.id);
                                },
                                "Booking approved."
                              )
                            }
                            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              void runAction(
                                async () => {
                                  await rejectBooking(booking.id);
                                },
                                normalizedStatus === "PAYMENT_PENDING" ? "Booking cancelled." : "Booking rejected."
                              )
                            }
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                          >
                            {normalizedStatus === "PAYMENT_PENDING" ? "Cancel hold" : "Reject"}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
            <h2 className="text-xl font-semibold text-slate-950">Manual / offline booking</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Record phone, WhatsApp, or cash bookings against a specific trip without bypassing seat checks.
            </p>

            <form onSubmit={handleOfflineBooking} className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-[#f7f1e8] p-4 text-sm text-slate-700">
                {selectedTrip ? (
                  <>
                    <p className="font-semibold text-slate-950">{selectedTrip.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedTrip.available_seats} seats currently available
                    </p>
                  </>
                ) : (
                  <p>Select a trip above to enable offline booking.</p>
                )}
              </div>

              <input
                value={offlineSeats}
                onChange={(event) => setOfflineSeats(event.target.value)}
                type="number"
                min="1"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Seats"
              />
              <input
                value={offlineName}
                onChange={(event) => setOfflineName(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Traveler name"
              />
              <input
                value={offlinePhone}
                onChange={(event) => setOfflinePhone(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Phone"
              />
              <input
                value={offlineEmail}
                onChange={(event) => setOfflineEmail(event.target.value)}
                type="email"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Email"
              />
              <textarea
                value={offlineNote}
                onChange={(event) => setOfflineNote(event.target.value)}
                rows={4}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Internal note"
              />
              <button
                type="submit"
                disabled={isMutating || !selectedTripId}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Add offline booking
              </button>
            </form>
          </div>
        </aside>
      </div>
    </OrganizerWorkspaceShell>
  );
}

export default function OrganizerBookingsPage() {
  return (
    <Suspense fallback={null}>
      <OrganizerBookingsPageInner />
    </Suspense>
  );
}
