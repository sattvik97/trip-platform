"use client";

import { useEffect, useState } from "react";
import { getUserBookingForTrip, UserBooking } from "@/src/lib/api/user";
import { BookingStatusBanner } from "./BookingStatusBanner";
import { useAuth } from "@/src/contexts/AuthContext";

interface TripBookingStatusProps {
  tripId: string;
}

export function TripBookingStatus({ tripId }: TripBookingStatusProps) {
  const { isAuthenticated, role } = useAuth();
  const [booking, setBooking] = useState<UserBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "user") {
      setIsLoading(false);
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
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [tripId, isAuthenticated, role]);

  if (isLoading || !booking) {
    return null;
  }

  return <BookingStatusBanner booking={booking} />;
}

