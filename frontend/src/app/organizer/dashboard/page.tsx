"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOrganizerTrips,
  OrganizerTrip,
  getOrganizerBookings,
  approveBooking,
  rejectBooking,
  OrganizerBooking,
} from "@/src/lib/api/organizer";
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

type TabType = "trips" | "bookings";

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("trips");
  const [trips, setTrips] = useState<OrganizerTrip[]>([]);
  const [bookings, setBookings] = useState<OrganizerBooking[]>([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
      return;
    }

    const fetchTrips = async () => {
      try {
        const data = await getOrganizerTrips();
        setTrips(data);
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/organizer/login");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load trips");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [router]);

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings();
    }
  }, [activeTab, bookingStatusFilter]);

  const fetchBookings = async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    setIsLoadingBookings(true);
    setError("");
    try {
      const data = await getOrganizerBookings(bookingStatusFilter);
      setBookings(data);
    } catch (err) {
      if (err instanceof Error && err.message === "Authentication failed") {
        router.push("/organizer/login");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      }
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await approveBooking(bookingId);
      // Refresh bookings list
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve booking");
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await rejectBooking(bookingId);
      // Refresh bookings list
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject booking");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading trips...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <div className="flex gap-3">
            {activeTab === "trips" && (
              <button
                type="button"
                onClick={() => router.push("/organizer/trips/create")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Trip
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("trips")}
              className={`${
                activeTab === "trips"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Trips
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`${
                activeTab === "bookings"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Booking Requests
            </button>
          </nav>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {activeTab === "trips" && (
          <>
            {trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-6">
              You haven't created any trips yet.
            </p>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => router.push("/organizer/trips/create")}
            >
              Create your first trip
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium text-indigo-600 truncate">
                              {trip.title}
                            </p>
                            {trip.tags && trip.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {trip.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {formatCurrency(trip.price)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {trip.destination}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              {formatDate(trip.start_date)} –{" "}
                              {formatDate(trip.end_date)}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span>Total seats: {trip.total_seats}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => {
                            // Navigation only, no form yet
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
            )}
          </>
        )}

        {activeTab === "bookings" && (
          <div>
            {/* Status Filter */}
            <div className="mb-4 flex items-center gap-4">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Filter by status:
              </label>
              <select
                id="status-filter"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {isLoadingBookings ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">
                  {bookingStatusFilter
                    ? `No ${bookingStatusFilter.toLowerCase()} bookings found.`
                    : "No bookings found."}
                </p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <li key={booking.id}>
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-medium text-indigo-600 truncate">
                                  {booking.trip_title || "Unknown Trip"}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {booking.trip_destination || "Unknown Destination"}
                                </p>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    booking.status === "APPROVED"
                                      ? "bg-green-100 text-green-800"
                                      : booking.status === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 space-y-2">
                              <div className="sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    Seats: {booking.seats_booked}
                                  </p>
                                  {booking.user_email && (
                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                      User: {booking.user_email}
                                    </p>
                                  )}
                                  <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                    {formatDate(booking.created_at)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Traveler Details */}
                              {booking.traveler_details && booking.traveler_details.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Travelers ({booking.num_travelers || booking.traveler_details.length}):
                                  </p>
                                  <div className="space-y-2">
                                    {booking.traveler_details.map((traveler, idx) => (
                                      <div key={idx} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                                        <span className="font-medium">{traveler.name}</span>
                                        {traveler.age && `, Age: ${traveler.age}`}
                                        {traveler.gender && `, ${traveler.gender}`}
                                        {traveler.profession && `, ${traveler.profession}`}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Contact Details */}
                              {(booking.contact_name || booking.contact_phone || booking.contact_email) && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Contact:</p>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    {booking.contact_name && <p>Name: {booking.contact_name}</p>}
                                    {booking.contact_phone && <p>Phone: {booking.contact_phone}</p>}
                                    {booking.contact_email && <p>Email: {booking.contact_email}</p>}
                                  </div>
                                </div>
                              )}
                              
                              {/* Price Info */}
                              {booking.total_price && booking.price_per_person && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="text-sm text-gray-600">
                                    <p>
                                      Price: ₹{booking.price_per_person.toLocaleString()} per person × {booking.num_travelers || booking.seats_booked} = ₹{booking.total_price.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {booking.status === "PENDING" && (
                            <div className="ml-5 flex-shrink-0 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprove(booking.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(booking.id)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

