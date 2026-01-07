"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isUserAuthenticated } from "@/src/lib/userAuth";
import { getUserBookingForTrip, UserBooking } from "@/src/lib/api/user";
import { useAuth } from "@/src/contexts/AuthContext";

interface BookingCardProps {
  tripId: string;
  tripSlug: string;
  price: number;
  dateRange: string;
  duration: string;
  groupSize: string;
  seatsAvailable: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export function BookingCard({
  tripId,
  tripSlug,
  price,
  dateRange,
  duration,
  groupSize,
  seatsAvailable,
  status,
}: BookingCardProps) {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const userLoggedIn = isAuthenticated && role === "user";
  const [booking, setBooking] = useState<UserBooking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);

  useEffect(() => {
    if (!userLoggedIn) {
      setIsLoadingBooking(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const bookingData = await getUserBookingForTrip(tripId);
        setBooking(bookingData);
      } catch (error) {
        console.error("Failed to fetch booking:", error);
        setBooking(null);
      } finally {
        setIsLoadingBooking(false);
      }
    };

    fetchBooking();
  }, [tripId, userLoggedIn]);

  const handleBookingRequest = () => {
    if (!userLoggedIn) {
      router.push("/login");
      return;
    }

    // If user already has a booking, navigate to confirmation page
    if (booking) {
      router.push(`/bookings/${booking.id}/confirmation`);
      return;
    }

    // Navigate to booking details page
    router.push(`/trip/${tripSlug}/book`);
  };

  // Determine button text and disabled state
  const getButtonState = () => {
    if (status === "ARCHIVED") {
      return { text: "Trip Archived", disabled: true };
    }
    if (status && status !== "PUBLISHED") {
      return { text: "Bookings Not Available", disabled: true };
    }
    if (seatsAvailable === 0) {
      return { text: "No Seats Available", disabled: true };
    }
    if (booking) {
      if (booking.status === "PENDING") {
        return { text: "View Booking Request", disabled: false };
      }
      if (booking.status === "APPROVED") {
        return { text: "View Confirmed Booking", disabled: false };
      }
      if (booking.status === "REJECTED") {
        return { text: "View Booking Details", disabled: false };
      }
    }
    if (!userLoggedIn) {
      return { text: "Login to Book", disabled: false };
    }
    return { text: "Book Now", disabled: false };
  };

  const buttonState = getButtonState();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            ₹{price.toLocaleString()}
          </span>
          <span className="text-gray-500 text-sm">per person</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Dates</p>
            <p className="text-sm text-gray-600">{dateRange}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Duration</p>
            <p className="text-sm text-gray-600">{duration}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Group Size</p>
            <p className="text-sm text-gray-600">{groupSize}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Seats left</p>
            <p className="text-sm text-gray-600">
              {seatsAvailable} {seatsAvailable === 1 ? "seat" : "seats"} left
            </p>
          </div>
        </div>
      </div>

      {/* Booking CTA */}
      {!isLoadingBooking && (
        <>
          <button
            type="button"
            onClick={handleBookingRequest}
            disabled={buttonState.disabled}
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors border border-transparent disabled:border-gray-200"
          >
            {buttonState.text}
          </button>
          {!userLoggedIn && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Sign in to book this trip
            </p>
          )}
        </>
      )}
      {isLoadingBooking && (
        <div className="w-full py-4 px-6 rounded-lg font-semibold text-lg bg-gray-100 text-gray-600 text-center">
          Loading...
        </div>
      )}
    </div>
  );
}

