"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOrganizerTrips,
  OrganizerTrip,
  getOrganizerBookings,
  approveBooking,
  rejectBooking,
  OrganizerBooking,
  publishTrip,
  archiveTrip,
  unarchiveTrip,
} from "@/src/lib/api/organizer";
import { getTripImages } from "@/src/lib/api/trip-images";
import { getToken } from "@/src/lib/auth";
import { useAuth } from "@/src/contexts/AuthContext";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [trips, setTrips] = useState<OrganizerTrip[]>([]);
  const [bookings, setBookings] = useState<OrganizerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "ongoing" | "past" | undefined>(undefined);
  const [imageCounts, setImageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [tripData, bookingData] = await Promise.all([
          getOrganizerTrips(timeFilter),
          getOrganizerBookings(""),
        ]);
        setTrips(tripData);
        setBookings(bookingData);
        
        // Fetch image counts for all trips
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
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/organizer/login");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, timeFilter]);

  const refreshTrips = async () => {
    try {
      const data = await getOrganizerTrips(timeFilter);
      setTrips(data);
      
      // Refresh image counts
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (trip) => {
          try {
            const images = await getTripImages(trip.id);
            counts[trip.id] = images.length;
          } catch {
            counts[trip.id] = 0;
          }
        })
      );
      setImageCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh trips");
    }
  };

  const refreshBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const data = await getOrganizerBookings("");
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh bookings");
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await approveBooking(bookingId);
      await refreshBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve booking");
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await rejectBooking(bookingId);
      await refreshBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject booking");
    }
  };

  const handlePublishTrip = async (tripId: string) => {
    try {
      await publishTrip(tripId);
      await refreshTrips();
      setError(""); // Clear any previous errors
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to publish trip";
      setError(errorMessage);
      // Show error for a few seconds
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleArchiveTrip = async (tripId: string) => {
    try {
      await archiveTrip(tripId);
      await refreshTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive trip");
    }
  };

  const handleUnarchiveTrip = async (tripId: string) => {
    try {
      await unarchiveTrip(tripId);
      await refreshTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unarchive trip");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "PENDING"),
    [bookings]
  );

  const analytics = useMemo(() => {
    const totalTrips = trips.length;
    const publishedTrips = trips.filter((t) => t.status === "PUBLISHED").length;
    const pendingRequests = pendingBookings.length;
    const approvedTravelers = bookings
      .filter((b) => b.status === "APPROVED")
      .reduce((sum, b) => sum + (b.num_travelers || b.seats_booked || 0), 0);

    return { totalTrips, publishedTrips, pendingRequests, approvedTravelers };
  }, [trips, bookings, pendingBookings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Operate your trips, review requests, and keep travelers moving.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/organizer/trips/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Trip
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Analytics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total trips", value: analytics.totalTrips },
            { label: "Published trips", value: analytics.publishedTrips },
            { label: "Pending requests", value: analytics.pendingRequests },
            { label: "Approved travelers", value: analytics.approvedTravelers },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Pending booking requests */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending booking requests</h2>
              <p className="text-sm text-gray-600">
                Approve or reject new requests to keep trips on track.
              </p>
            </div>
            {isLoadingBookings && (
              <span className="text-sm text-gray-500">Refreshing...</span>
            )}
          </div>
          {pendingBookings.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              No pending requests right now. You’re all caught up.
            </div>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {pendingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.trip_title || "Unknown Trip"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.user_email ? `User: ${booking.user_email}` : "User: Unknown"}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <p className="text-gray-500">Seats requested</p>
                      <p className="font-semibold">
                        {booking.num_travelers || booking.seats_booked}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total price</p>
                      <p className="font-semibold">
                        {booking.total_price
                          ? formatCurrency(booking.total_price)
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(booking.id)}
                      className="inline-flex justify-center items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(booking.id)}
                      className="inline-flex justify-center items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trips table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trips</h2>
              <p className="text-sm text-gray-600">
                Manage lifecycle and visibility. Edit is limited to draft trips.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTimeFilter(undefined)}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  timeFilter === undefined
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("upcoming")}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  timeFilter === "upcoming"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("ongoing")}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  timeFilter === "ongoing"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ongoing
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("past")}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  timeFilter === "past"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Past
              </button>
            </div>
          </div>
          {trips.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              You haven’t created any trips yet. Start with your first itinerary.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Trip", "Dates", "Status", "Total seats", "Price", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => {
                    const isDraft = trip.status === "DRAFT";
                    const isPublished = trip.status === "PUBLISHED";
                    const isArchived = trip.status === "ARCHIVED";
                    const imageCount = imageCounts[trip.id] || 0;
                    const canPublish = isDraft && imageCount > 0;

                    return (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{trip.title}</div>
                          <div className="text-sm text-gray-500">{trip.destination}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              isPublished
                                ? "bg-blue-100 text-blue-800"
                                : isArchived
                                ? "bg-gray-200 text-gray-700"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {trip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {trip.total_seats}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatCurrency(trip.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!isDraft}
                              title={
                                isDraft
                                  ? "Edit trip details"
                                  : "Editing is only allowed while the trip is in DRAFT"
                              }
                              className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                                isDraft
                                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
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
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePublishTrip(trip.id)}
                                  disabled={!canPublish}
                                  title={
                                    canPublish
                                      ? "Publish this trip"
                                      : "Add at least one image to publish this trip"
                                  }
                                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                    canPublish
                                      ? "text-white bg-blue-600 hover:bg-blue-700"
                                      : "text-gray-400 bg-gray-200 cursor-not-allowed"
                                  }`}
                                >
                                  Publish
                                </button>
                                {imageCount === 0 && (
                                  <span className="text-xs text-gray-500 text-right">
                                    Add image to publish
                                  </span>
                                )}
                              </div>
                            )}
                            {isPublished && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/trip/${trip.slug}`)}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleArchiveTrip(trip.id)}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUnarchiveTrip(trip.id)}
                                  title="Move back to draft to edit or republish"
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
        </div>
      </div>
    </div>
  );
}

