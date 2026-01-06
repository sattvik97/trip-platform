"use client";

import Link from "next/link";
import { UserBooking } from "@/src/lib/api/user";

interface BookingStatusBannerProps {
  booking: UserBooking;
}

export function BookingStatusBanner({ booking }: BookingStatusBannerProps) {
  if (booking.status === "PENDING") {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Booking Request Pending
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your booking request is awaiting organizer approval. You'll be
                notified once it's reviewed.
              </p>
            </div>
            <div className="mt-3">
              <Link
                href={`/bookings/${booking.id}/confirmation`}
                className="text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
              >
                View booking details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (booking.status === "APPROVED") {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              Booking Confirmed
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Your booking has been approved! Your spot is confirmed for this
                trip.
              </p>
            </div>
            <div className="mt-3">
              <Link
                href={`/bookings/${booking.id}/confirmation`}
                className="text-sm font-medium text-green-800 underline hover:text-green-900"
              >
                View booking details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (booking.status === "REJECTED") {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Booking Request Rejected
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Your booking request was not approved. You can explore other
                trips or contact the organizer for more information.
              </p>
            </div>
            <div className="mt-3">
              <Link
                href={`/bookings/${booking.id}/confirmation`}
                className="text-sm font-medium text-red-800 underline hover:text-red-900"
              >
                View booking details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

