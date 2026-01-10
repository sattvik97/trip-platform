import { getUserToken } from "../userAuth";
import { buildApiUrl } from "./config";

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export async function registerUser(
  data: UserRegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(buildApiUrl("/api/v1/user/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }
    throw new Error(`Registration failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function loginUser(
  credentials: UserLoginRequest
): Promise<LoginResponse> {
  const response = await fetch(buildApiUrl("/api/v1/user/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid email or password");
    }
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return await response.json();
}

export interface TravelerDetail {
  name: string;
  age: number;
  gender: string;
  profession?: string;
}

export interface UserBooking {
  id: string;
  trip_id: string;
  user_id: string | null;
  seats_booked: number;
  source: string;
  status: string;
  created_at: string;
  trip_title: string | null;
  trip_destination: string | null;
  trip_start_date: string | null;
  trip_end_date: string | null;
  user_email: string | null;
  num_travelers: number | null;
  traveler_details: TravelerDetail[] | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  price_per_person: number | null;
  total_price: number | null;
  currency: string | null;
}

export async function getUserBookings(): Promise<UserBooking[]> {
  const token = getUserToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(buildApiUrl("/api/v1/user/bookings"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to fetch bookings: ${response.statusText}`
    );
  }

  return await response.json();
}

export async function getUserBooking(bookingId: string): Promise<UserBooking> {
  const token = getUserToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(buildApiUrl(`/api/v1/user/bookings/${bookingId}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    if (response.status === 404) {
      throw new Error("Booking not found");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to fetch booking: ${response.statusText}`
    );
  }

  return await response.json();
}

export async function getUserBookingForTrip(tripId: string): Promise<UserBooking | null> {
  const token = getUserToken();

  if (!token) {
    return null; // Not authenticated, return null
  }

  const response = await fetch(buildApiUrl(`/api/v1/user/bookings/trip/${tripId}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null; // No booking found
  }

  if (!response.ok) {
    if (response.status === 401) {
      return null; // Not authenticated
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to fetch booking: ${response.statusText}`
    );
  }

  return await response.json();
}

