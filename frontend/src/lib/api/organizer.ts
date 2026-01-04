import { getToken } from "../auth";

export interface OrganizerTrip {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  destination: string;
  price: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  total_seats: number;
  tags: string[] | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  itinerary: Array<{ day: number; title: string; description: string }> | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: "user" | "organizer";
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: string;
  organizer_id: string | null;
}

export async function registerOrganizer(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Registration failed: ${response.statusText}`
    );
  }

  return await response.json();
}

export async function loginOrganizer(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
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

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

export type TripTag =
  | "TREK"
  | "BACKPACKING"
  | "STARGAZING"
  | "RELAXING"
  | "ADVENTURE"
  | "SOLO"
  | "GROUP"
  | "WOMEN_ONLY"
  | "WOMEN_FRIENDLY"
  | "BEGINNER_FRIENDLY"
  | "WEEKEND"
  | "MULTI_DAY"
  | "HIGH_ALTITUDE"
  | "CULTURAL_EXPERIENCE"
  | "NATURE_RETREAT"
  | "PHOTOGRAPHY"
  | "INSTAGRAMMABLE"
  | "BUDGET"
  | "MID_RANGE"
  | "PREMIUM";

export interface CreateTripRequest {
  title: string;
  description?: string;
  destination: string;
  price: number;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  total_seats: number;
  tags?: TripTag[];
  itinerary?: ItineraryItem[];
}

export async function createTrip(
  tripData: CreateTripRequest
): Promise<OrganizerTrip> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/organizer/trips`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to create trip: ${response.statusText}`
    );
  }

  return await response.json();
}

export async function getOrganizerTrips(): Promise<OrganizerTrip[]> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/organizer/trips`, {
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
    throw new Error(`Failed to fetch trips: ${response.statusText}`);
  }

  return await response.json();
}

