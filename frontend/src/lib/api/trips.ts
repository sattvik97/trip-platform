import type { Trip } from "@/src/types/trip";
import { buildApiUrl, getApiBase } from "./config";

export interface GetTripsParams {
  page?: number;
  limit?: number;
  destination?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  tags?: string[];
}

export interface SearchTripsParams {
  page?: number;
  limit?: number;
  q?: string;
  start_date?: string;
  end_date?: string;
  range_start?: string;
  range_end?: string;
  month?: string;
  people?: number;
  min_price?: number;
  max_price?: number;
  min_days?: number;
  max_days?: number;
}

const API_CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
]);
const READ_FALLBACK_WINDOW_MS = 10_000;
const loggedApiMessages = new Set<string>();
let readsUnavailableUntil = 0;

type ErrorRecord = {
  cause?: unknown;
  code?: unknown;
  errors?: unknown;
};

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const maybeError = error as ErrorRecord;

  if (typeof maybeError.code === "string") {
    return maybeError.code;
  }

  if (Array.isArray(maybeError.errors)) {
    for (const nestedError of maybeError.errors) {
      const nestedCode = getErrorCode(nestedError);
      if (nestedCode) {
        return nestedCode;
      }
    }
  }

  return getErrorCode(maybeError.cause);
}

function isBackendConnectionIssue(error: unknown): boolean {
  const code = getErrorCode(error);

  if (code && API_CONNECTION_ERROR_CODES.has(code)) {
    return true;
  }

  return error instanceof TypeError && /fetch failed/i.test(error.message);
}

function logOnce(key: string, log: () => void) {
  if (loggedApiMessages.has(key)) {
    return;
  }

  loggedApiMessages.add(key);
  log();
}

function markReadsUnavailable() {
  readsUnavailableUntil = Date.now() + READ_FALLBACK_WINDOW_MS;
}

export function isTripsApiTemporarilyUnavailable(): boolean {
  return Date.now() < readsUnavailableUntil;
}

function logReadFailure(label: string, error: unknown) {
  if (isBackendConnectionIssue(error)) {
    markReadsUnavailable();
    logOnce("trips-api-unavailable", () => {
      console.warn(
        `[Trips API] Backend at ${getApiBase()} is unreachable. Showing fallback empty states until it recovers.`
      );
    });
    return;
  }

  logOnce(label, () => {
    console.error(`${label}:`, error);
  });
}

async function fetchReadJson<T>(
  url: string,
  fallback: T,
  label: string
): Promise<T> {
  if (isTripsApiTemporarilyUnavailable()) {
    return fallback;
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    logReadFailure(label, error);
    return fallback;
  }
}

export async function getTrips(
  params: GetTripsParams = {}
): Promise<Trip[]> {
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

  const url = new URL(buildApiUrl("/api/v1/trips"));
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

  return fetchReadJson(url.toString(), [], "Error fetching trips");
}

export async function getTripBySlug(
  tripSlug: string
): Promise<Trip | null> {
  if (isTripsApiTemporarilyUnavailable()) {
    return null;
  }

  try {
    const response = await fetch(buildApiUrl(`/api/v1/trips/${tripSlug}`), {
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
    logReadFailure("Error fetching trip", error);
    return null;
  }
}

export async function getWeekendGetaways(): Promise<Trip[]> {
  return fetchReadJson(
    buildApiUrl("/api/v1/trips/weekend-getaways"),
    [],
    "Error fetching weekend getaways"
  );
}

export async function searchTrips(
  params: SearchTripsParams = {}
): Promise<Trip[]> {
  const {
    page = 1,
    limit = 20,
    q,
    start_date,
    end_date,
    range_start,
    range_end,
    month,
    people,
    min_price,
    max_price,
    min_days,
    max_days,
  } = params;

  const offset = (page - 1) * limit;

  const url = new URL(buildApiUrl("/api/v1/trips/search"));
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());

  if (q) {
    url.searchParams.set("q", q);
  }
  if (start_date) {
    url.searchParams.set("start_date", start_date);
  }
  if (end_date) {
    url.searchParams.set("end_date", end_date);
  }
  if (range_start) {
    url.searchParams.set("range_start", range_start);
  }
  if (range_end) {
    url.searchParams.set("range_end", range_end);
  }
  if (month) {
    url.searchParams.set("month", month);
  }
  if (people !== undefined) {
    url.searchParams.set("people", people.toString());
  }
  if (min_price !== undefined) {
    url.searchParams.set("min_price", min_price.toString());
  }
  if (max_price !== undefined) {
    url.searchParams.set("max_price", max_price.toString());
  }
  if (min_days !== undefined) {
    url.searchParams.set("min_days", min_days.toString());
  }
  if (max_days !== undefined) {
    url.searchParams.set("max_days", max_days.toString());
  }

  return fetchReadJson(url.toString(), [], "Error searching trips");
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
  const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;

  if (!token) {
    throw new Error("User authentication required");
  }

  try {
    const response = await fetch(buildApiUrl(`/api/v1/trips/${tripId}/bookings`), {
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
