"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { getUserBooking, UserBooking } from "@/src/lib/api/user";
import { useAuth } from "@/src/contexts/AuthContext";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startFormatted = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endFormatted = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFormatted} – ${endFormatted}`;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, role } = useAuth();
  const bookingId = params?.booking_id as string;

  const [booking, setBooking] = useState<UserBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || role !== "user") {
      router.push("/login");
      return;
    }

    const fetchBooking = async () => {
      try {
        const bookingData = await getUserBooking(bookingId);
        setBooking(bookingData);
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/login");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load booking");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, isAuthenticated, role, router]);

  if (!isAuthenticated || role !== "user") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h1 className="text-xl font-bold text-red-900 mb-2">Error</h1>
              <p className="text-red-800">{error || "Booking not found"}</p>
              <div className="mt-4">
                <Link
                  href="/account/bookings"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View My Bookings →
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Your booking has been approved!";
      case "REJECTED":
        return "Your booking request was rejected.";
      case "PENDING":
      default:
        return "Awaiting organizer approval";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Booking Request Submitted
                </h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                  <span className="text-gray-600">{getStatusMessage(booking.status)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Trip Summary</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Trip Name</p>
                <p className="text-lg text-gray-900">{booking.trip_title || "Unknown Trip"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Destination</p>
                <p className="text-gray-900">{booking.trip_destination || "Unknown"}</p>
              </div>
              {booking.trip_start_date && booking.trip_end_date && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Trip Dates</p>
                  <p className="text-gray-900">
                    {formatDateRange(booking.trip_start_date, booking.trip_end_date)}
                  </p>
                </div>
              )}
              {booking.created_at && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Booking Date</p>
                  <p className="text-gray-900">{formatDate(booking.created_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Number of Travelers</p>
                <p className="text-gray-900">
                  {booking.num_travelers || booking.seats_booked} {booking.num_travelers === 1 || booking.seats_booked === 1 ? "person" : "people"}
                </p>
              </div>
              {booking.total_price && booking.price_per_person && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{booking.total_price.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₹{booking.price_per_person.toLocaleString()} per person
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">What happens next?</h2>
            <div className="space-y-2 text-gray-700">
              {booking.status === "PENDING" && (
                <>
                  <p>• The trip organizer will review your booking request.</p>
                  <p>• You'll be notified once your booking is approved or rejected.</p>
                  <p>• You can track the status of your booking in "My Bookings".</p>
                </>
              )}
              {booking.status === "APPROVED" && (
                <>
                  <p>• Your booking has been confirmed!</p>
                  <p>• The organizer may contact you with further details.</p>
                  <p>• Check "My Bookings" for all your confirmed trips.</p>
                </>
              )}
              {booking.status === "REJECTED" && (
                <>
                  <p>• Your booking request was not approved.</p>
                  <p>• You can explore other trips or contact the organizer for more information.</p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/account/bookings"
              className="flex-1 text-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              View My Bookings
            </Link>
            <Link
              href="/"
              className="flex-1 text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

