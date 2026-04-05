"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrganizerWorkspaceShell } from "@/src/components/organizer/OrganizerWorkspaceShell";
import {
  OrganizerTrip,
  archiveTrip,
  duplicateTrip,
  getOrganizerTrips,
  publishTrip,
  unarchiveTrip,
} from "@/src/lib/api/organizer";
import { formatAmount } from "@/src/lib/bookingFinance";
import { getToken } from "@/src/lib/auth";

function formatTripWindow(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Dates unavailable";
  }
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function OrganizerTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<OrganizerTrip[]>([]);
  const [total, setTotal] = useState(0);
  const [timeFilter, setTimeFilter] = useState<"" | "upcoming" | "ongoing" | "past">("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const page = await getOrganizerTrips({
        time: timeFilter || undefined,
        limit: 50,
      });
      setTrips(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof Error && err.message === "Authentication failed") {
        router.push("/organizer/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load organizer trips");
    } finally {
      setIsLoading(false);
    }
  }, [router, timeFilter]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
      return;
    }
    void loadTrips();
  }, [loadTrips, router]);

  const grouped = useMemo(() => {
    return {
      drafts: trips.filter((trip) => trip.status === "DRAFT"),
      live: trips.filter((trip) => trip.status === "PUBLISHED"),
      archived: trips.filter((trip) => trip.status === "ARCHIVED"),
    };
  }, [trips]);

  const runMutation = async (task: () => Promise<void>) => {
    setIsMutating(true);
    setError("");
    try {
      await task();
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <OrganizerWorkspaceShell
      title="Trips with clear publish blockers and next actions"
      description="Create faster, duplicate what already works, and see exactly why a draft is not ready to go live."
      actions={
        <Link
          href="/organizer/trips/create"
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          New trip
        </Link>
      }
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: "", label: `All trips (${total})` },
          { key: "upcoming", label: "Upcoming" },
          { key: "ongoing", label: "Ongoing" },
          { key: "past", label: "Past" },
        ].map((filter) => (
          <button
            key={filter.key || "all"}
            type="button"
            onClick={() => setTimeFilter(filter.key as "" | "upcoming" | "ongoing" | "past")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              timeFilter === filter.key
                ? "bg-slate-950 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-10 text-center text-sm text-slate-500 shadow-lg shadow-slate-950/5">
          Loading trips...
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { title: "Drafts", helper: "Finish content, media, and policies before publishing.", items: grouped.drafts },
            { title: "Live trips", helper: "Published departures currently visible to travelers.", items: grouped.live },
            { title: "Archived", helper: "Past or paused departures you can reuse later.", items: grouped.archived },
          ].map((section) => (
            <section key={section.title} className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
              <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{section.helper}</p>

              {section.items.length === 0 ? (
                <div className="mt-5 rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-600">
                  No trips in this section.
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  {section.items.map((trip) => (
                    <article key={trip.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-950">{trip.title}</h3>
                            <span className="rounded-full bg-[#f7f1e8] px-3 py-1 text-xs font-semibold text-slate-700">
                              {trip.status}
                            </span>
                            {!trip.publish_ready && trip.status === "DRAFT" && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                Needs work
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{trip.destination}</p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            <span>{formatTripWindow(trip.start_date, trip.end_date)}</span>
                            <span>{formatAmount(trip.price, "INR")} per person</span>
                            <span>{trip.booked_seats} booked / {trip.total_seats} seats</span>
                          </div>

                          {trip.status === "DRAFT" && trip.publish_blockers.length > 0 && (
                            <div className="mt-4 rounded-2xl bg-amber-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                                Publish blockers
                              </p>
                              <div className="mt-2 grid gap-1">
                                {trip.publish_blockers.slice(0, 4).map((blocker) => (
                                  <p key={blocker} className="text-sm text-amber-900">
                                    • {blocker}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 xl:w-[320px] xl:justify-end">
                          <Link
                            href={`/organizer/bookings?tripId=${encodeURIComponent(trip.id)}`}
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                          >
                            Bookings
                          </Link>
                          {trip.status === "DRAFT" && (
                            <>
                              <Link
                                href={`/organizer/trips/${trip.id}/edit`}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                disabled={!trip.publish_ready || isMutating}
                                onClick={() => void runMutation(async () => { await publishTrip(trip.id); })}
                                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                Publish
                              </button>
                            </>
                          )}
                          {trip.status === "PUBLISHED" && (
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => void runMutation(async () => { await archiveTrip(trip.id); })}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                            >
                              Archive
                            </button>
                          )}
                          {trip.status === "ARCHIVED" && (
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => void runMutation(async () => { await unarchiveTrip(trip.id); })}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                            >
                              Restore to draft
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => void runMutation(async () => { await duplicateTrip(trip.id); })}
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                          >
                            Duplicate
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </OrganizerWorkspaceShell>
  );
}
