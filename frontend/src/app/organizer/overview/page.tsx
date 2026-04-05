"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OrganizerOverview,
  getOrganizerOverview,
} from "@/src/lib/api/organizer";
import { getToken } from "@/src/lib/auth";
import { formatAmount, formatDateTime } from "@/src/lib/bookingFinance";
import {
  OrganizerMetricCard,
  OrganizerWorkspaceShell,
} from "@/src/components/organizer/OrganizerWorkspaceShell";

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not scheduled";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrganizerOverviewPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OrganizerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/organizer/login");
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getOrganizerOverview();
        setOverview(data);
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/organizer/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load organizer overview");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [router]);

  return (
    <OrganizerWorkspaceShell
      title="What needs your attention, what pays out next, and what still blocks trust"
      description="This is your daily host home: review requests, remove draft blockers, and keep verification and payouts moving without bouncing between screens."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/organizer/trips/create"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            New trip
          </Link>
          <Link
            href="/organizer/finance"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Open finance
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isLoading || !overview ? (
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-10 text-center text-sm text-slate-500 shadow-lg shadow-slate-950/5">
          Loading organizer overview...
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <OrganizerMetricCard
              label="Review queue"
              value={overview.review_queue_count}
              helper="Traveler requests waiting for your decision."
            />
            <OrganizerMetricCard
              label="Payment pending"
              value={overview.payment_pending_count}
              helper="Approved travelers who still need to complete payment."
            />
            <OrganizerMetricCard
              label="Live trips"
              value={overview.active_trips}
              helper="Published departures currently visible to travelers."
            />
            <OrganizerMetricCard
              label="Available payout"
              value={formatAmount(overview.available_balance, "INR")}
              helper="Net balance currently ready to move into a payout."
            />
            <OrganizerMetricCard
              label="Gross bookings"
              value={formatAmount(overview.gross_bookings, "INR")}
              helper="Captured traveler revenue before fees and refunds."
            />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Verification checklist</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Travelers trust complete profiles more, and payouts move faster once your
                      host identity and settlement details are in place.
                    </p>
                  </div>
                  <Link
                    href="/organizer/profile"
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                  >
                    Complete profile
                  </Link>
                </div>

                <div className="mt-5 grid gap-3">
                  {overview.verification_checklist.map((item) => (
                    <div
                      key={item.key}
                      className={`rounded-3xl border p-4 ${
                        item.completed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-[#f7f1e8]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Review queue</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Clear oldest traveler requests first so you do not waste conversion on slow
                      responses.
                    </p>
                  </div>
                  <Link
                    href="/organizer/bookings"
                    className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                  >
                    Open bookings
                  </Link>
                </div>

                <div className="mt-5 grid gap-3">
                  {overview.urgent_bookings.length === 0 ? (
                    <div className="rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-600">
                      Nothing is waiting on a decision right now.
                    </div>
                  ) : (
                    overview.urgent_bookings.map((booking) => (
                      <article key={booking.id} className="rounded-3xl border border-slate-200 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{booking.trip_title}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {booking.traveler_name} · {booking.travelers} travelers
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {booking.status}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Requested {formatDateTime(booking.created_at)}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
                <h2 className="text-xl font-semibold text-slate-950">Payout forecast</h2>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-3xl bg-[#f7f1e8] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Available now
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {formatAmount(overview.available_balance, "INR")}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Releasing next
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatAmount(overview.next_payout_amount, "INR")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateLabel(overview.next_payout_date)}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Still pending
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatAmount(overview.pending_balance, "INR")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Funds still inside the payout hold window.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Draft blockers</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      These drafts are closest to going live if you fix the remaining gaps.
                    </p>
                  </div>
                  <Link
                    href="/organizer/trips"
                    className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                  >
                    Open trips
                  </Link>
                </div>
                <div className="mt-5 grid gap-3">
                  {overview.draft_trip_alerts.length === 0 ? (
                    <div className="rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-600">
                      No draft blockers. Your current drafts are publish-ready.
                    </div>
                  ) : (
                    overview.draft_trip_alerts.map((trip) => (
                      <article key={trip.id} className="rounded-3xl border border-slate-200 p-5">
                        <p className="text-sm font-semibold text-slate-950">{trip.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Departure {formatDateLabel(trip.start_date)}
                        </p>
                        <div className="mt-3 grid gap-1">
                          {trip.publish_blockers.map((blocker) => (
                            <p key={blocker} className="text-sm text-slate-600">
                              - {blocker}
                            </p>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
                <h2 className="text-xl font-semibold text-slate-950">Upcoming departures</h2>
                <div className="mt-5 grid gap-3">
                  {overview.upcoming_trips.length === 0 ? (
                    <div className="rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-600">
                      No upcoming live departures yet.
                    </div>
                  ) : (
                    overview.upcoming_trips.map((trip) => (
                      <article key={trip.id} className="rounded-3xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{trip.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{trip.destination}</p>
                          </div>
                          <p className="text-xs text-slate-500">{formatDateLabel(trip.start_date)}</p>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          {trip.booked_seats} booked / {trip.total_seats} seats · {trip.available_seats} left
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </OrganizerWorkspaceShell>
  );
}
