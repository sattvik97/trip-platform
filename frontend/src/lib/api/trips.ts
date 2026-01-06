import type { Trip } from "@/src/types/trip";

export interface GetTripsParams {
  page?: number;
  limit?: number;
  destination?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  tags?: string[];
}

export async function getTrips(
  params: GetTripsParams = {}
): Promise<Trip[]> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const {
    page = 1,
    limit = 20,
    destination,
    min_price,
    max_price,
    start_date,
    tags,
  } = params;

  const offset = (page - 1) * limit;

  const url = new URL(`${apiBaseUrl}/api/v1/trips`);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());

  if (destination) {
    url.searchParams.set("destination", destination);
  }
  if (min_price !== undefined) {
    url.searchParams.set("min_price", min_price.toString());
  }
  if (max_price !== undefined) {
    url.searchParams.set("max_price", max_price.toString());
  }
  if (start_date) {
    url.searchParams.set("start_date", start_date);
  }
  if (tags && tags.length > 0) {
    // Add multiple tag parameters using append() for array support
    tags.forEach((tag) => {
      url.searchParams.append("tag", tag);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trips: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching trips:", error);
    return [];
  }
}

export async function getTripBySlug(
  tripSlug: string
): Promise<Trip | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/trips/${tripSlug}`, {
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch trip: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching trip:", error);
    return null;
  }
}

export interface TravelerDetail {
  name: string;
  age: number;
  gender: string;
  profession?: string;
}

export interface BookingRequest {
  num_travelers: number;
  travelers: TravelerDetail[];
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  price_per_person: number;
  total_price: number;
  currency: string;
}

export interface BookingResponse {
  message: string;
  booking_id: string;
  status: string;
}

export async function createBookingRequest(
  tripId: string,
  request: BookingRequest
): Promise<BookingResponse> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;

  if (!token) {
    throw new Error("User authentication required");
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/trips/${tripId}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create booking: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating booking request:", error);
    throw error;
  }
}