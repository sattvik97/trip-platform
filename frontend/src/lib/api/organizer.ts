import { getToken } from "../auth";
import { buildApiUrl } from "./config";

export interface OrganizerTrip {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  destination: string;
  price: number;
  meeting_point: string | null;
  difficulty_level: string | null;
  cancellation_policy: string | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  start_date: string;
  end_date: string;
  total_seats: number;
  available_seats: number;
  booked_seats: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tags: string[] | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  itinerary: Array<{ day: number; title: string; description: string }> | null;
  is_active: boolean;
  created_at: string;
  publish_ready: boolean;
  publish_blockers: string[];
}

export interface OrganizerTripsPage {
  items: OrganizerTrip[];
  total: number;
  page: number;
  page_size: number;
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
  name?: string;
  phone?: string;
  website?: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: string;
  organizer_id: string | null;
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
  meeting_point?: string;
  difficulty_level?: string;
  cancellation_policy?: string;
  inclusions?: string[];
  exclusions?: string[];
  start_date: string;
  end_date: string;
  total_seats: number;
  tags?: TripTag[];
  itinerary?: ItineraryItem[];
}

export interface OrganizerTripQuery {
  limit?: number;
  offset?: number;
  time?: "upcoming" | "ongoing" | "past";
}

export interface TravelerDetail {
  name: string;
  age: number;
  gender: string;
  profession?: string;
}

export interface OrganizerBooking {
  id: string;
  trip_id: string;
  user_id: string | null;
  seats_booked: number;
  source: string;
  status: string;
  amount_snapshot?: number | null;
  expires_at?: string | null;
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
  organizer_note: string | null;
  decision_reason: string | null;
  decision_at: string | null;
}

export interface OrganizerBookingsPage {
  items: OrganizerBooking[];
  total: number;
  page: number;
  page_size: number;
}

export interface OrganizerBookingsQuery {
  limit?: number;
  offset?: number;
  trip_id?: string;
}

export interface OrganizerReviewPayload {
  note?: string;
  reason?: string;
}

export interface OrganizerBulkReviewResponse {
  processed: number;
  failed: number;
  items: OrganizerBooking[];
  errors: Array<{ booking_id: string; message: string }>;
}

export interface OrganizerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  bio: string | null;
  support_email: string | null;
  support_phone: string | null;
  payout_method: string | null;
  payout_beneficiary: string | null;
  payout_reference: string | null;
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED";
  verification_notes: string | null;
  verification_submitted_at: string | null;
  profile_completion_percent: number;
  publish_requirements_met: boolean;
  missing_profile_items: string[];
  verification_checklist: OrganizerVerificationChecklistItem[];
  can_submit_verification: boolean;
}

export interface OrganizerProfileUpdateRequest {
  name?: string;
  phone?: string;
  website?: string;
  bio?: string;
  support_email?: string;
  support_phone?: string;
  payout_method?: string;
  payout_beneficiary?: string;
  payout_reference?: string;
}

export interface OrganizerVerificationChecklistItem {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface OrganizerFinanceSummary {
  gross_bookings: number;
  platform_fees: number;
  refunds: number;
  pending_balance: number;
  available_balance: number;
  paid_out_total: number;
  net_earnings: number;
  next_payout_amount: number;
  next_payout_date: string | null;
  payout_setup_complete: boolean;
  payout_method: string | null;
  payout_reference: string | null;
}

export interface OrganizerLedgerEntry {
  id: number;
  booking_id: string | null;
  payment_id: number | null;
  payout_id: number | null;
  entry_type: "BOOKING_GROSS" | "PLATFORM_FEE" | "REFUND" | "PAYOUT";
  status: "PENDING" | "AVAILABLE" | "PAID_OUT";
  amount: number;
  currency: string;
  description: string | null;
  occurred_at: string;
  available_on: string | null;
}

export interface OrganizerLedgerPage {
  items: OrganizerLedgerEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface OrganizerPayout {
  id: number;
  amount: number;
  currency: string;
  status: "SCHEDULED" | "PROCESSING" | "PAID" | "FAILED";
  scheduled_for: string;
  paid_at: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizerPayoutsPage {
  items: OrganizerPayout[];
  total: number;
  page: number;
  page_size: number;
}

export interface OrganizerOverviewBooking {
  id: string;
  trip_id: string;
  trip_title: string;
  traveler_name: string;
  travelers: number;
  created_at: string;
  status: string;
}

export interface OrganizerOverviewTripAlert {
  id: string;
  title: string;
  start_date: string;
  publish_blockers: string[];
}

export interface OrganizerOverviewUpcomingTrip {
  id: string;
  title: string;
  start_date: string;
  destination: string;
  booked_seats: number;
  total_seats: number;
  available_seats: number;
}

export interface OrganizerOverview {
  active_trips: number;
  draft_trips: number;
  review_queue_count: number;
  payment_pending_count: number;
  confirmed_travelers: number;
  gross_bookings: number;
  pending_balance: number;
  available_balance: number;
  next_payout_amount: number;
  next_payout_date: string | null;
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED";
  can_submit_verification: boolean;
  verification_checklist: OrganizerVerificationChecklistItem[];
  urgent_bookings: OrganizerOverviewBooking[];
  draft_trip_alerts: OrganizerOverviewTripAlert[];
  upcoming_trips: OrganizerOverviewUpcomingTrip[];
}

export interface OfflineBookingRequest {
  seats: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  organizer_note?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseError(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) {
    throw new Error("Authentication failed");
  }
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.detail || fallback);
}

function numericValue(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function registerOrganizer(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(buildApiUrl("/api/v1/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await parseError(response, `Registration failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function loginOrganizer(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(buildApiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function createTrip(tripData: CreateTripRequest): Promise<OrganizerTrip> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/trips"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    await parseError(response, `Failed to create trip: ${response.statusText}`);
  }

  return await response.json();
}

export async function getOrganizerTrips(
  query: OrganizerTripQuery = {}
): Promise<OrganizerTripsPage> {
  const url = new URL(buildApiUrl("/api/v1/organizer/trips"));
  if (query.time) {
    url.searchParams.append("time", query.time);
  }
  if (typeof query.limit === "number") {
    url.searchParams.append("limit", String(query.limit));
  }
  if (typeof query.offset === "number") {
    url.searchParams.append("offset", String(query.offset));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch trips: ${response.statusText}`);
  }

  return await response.json();
}

export async function publishTrip(tripId: string): Promise<OrganizerTrip> {
  const response = await fetch(buildApiUrl(`/api/v1/trips/${tripId}/publish`), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await parseError(response, `Failed to publish trip: ${response.statusText}`);
  }

  return await response.json();
}

export async function archiveTrip(tripId: string): Promise<OrganizerTrip> {
  const response = await fetch(buildApiUrl(`/api/v1/trips/${tripId}/archive`), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await parseError(response, `Failed to archive trip: ${response.statusText}`);
  }

  return await response.json();
}

export async function unarchiveTrip(tripId: string): Promise<OrganizerTrip> {
  const response = await fetch(buildApiUrl(`/api/v1/trips/${tripId}/unarchive`), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await parseError(response, `Failed to unarchive trip: ${response.statusText}`);
  }

  return await response.json();
}

export async function duplicateTrip(tripId: string): Promise<OrganizerTrip> {
  const response = await fetch(buildApiUrl(`/api/v1/organizer/trips/${tripId}/duplicate`), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await parseError(response, `Failed to duplicate trip: ${response.statusText}`);
  }

  return await response.json();
}

export async function getOrganizerTrip(tripId: string): Promise<OrganizerTrip> {
  const response = await fetch(buildApiUrl(`/api/v1/organizer/trips/${tripId}`), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch trip: ${response.statusText}`);
  }

  return await response.json();
}

export async function updateTrip(tripId: string, tripData: CreateTripRequest): Promise<OrganizerTrip> {
  const response = await fetch(buildApiUrl(`/api/v1/organizer/trips/${tripId}`), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    await parseError(response, `Failed to update trip: ${response.statusText}`);
  }

  return await response.json();
}

export async function getOrganizerBookings(
  status?: string,
  query: OrganizerBookingsQuery = {}
): Promise<OrganizerBookingsPage> {
  const url = new URL(buildApiUrl("/api/v1/organizer/bookings"));
  if (status && status.trim() !== "") {
    url.searchParams.append("status", status);
  }
  if (typeof query.limit === "number") {
    url.searchParams.append("limit", String(query.limit));
  }
  if (typeof query.offset === "number") {
    url.searchParams.append("offset", String(query.offset));
  }
  if (query.trip_id) {
    url.searchParams.append("trip_id", query.trip_id);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch bookings: ${response.statusText}`);
  }

  return await response.json();
}

export async function approveBooking(
  bookingId: string,
  payload: OrganizerReviewPayload = {}
): Promise<OrganizerBooking> {
  const response = await fetch(buildApiUrl(`/api/v1/organizer/bookings/${bookingId}/approve`), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseError(response, `Failed to approve booking: ${response.statusText}`);
  }

  return await response.json();
}

export async function rejectBooking(
  bookingId: string,
  payload: OrganizerReviewPayload = {}
): Promise<OrganizerBooking> {
  const response = await fetch(buildApiUrl(`/api/v1/organizer/bookings/${bookingId}/reject`), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseError(response, `Failed to reject booking: ${response.statusText}`);
  }

  return await response.json();
}

export async function bulkReviewBookings(params: {
  booking_ids: string[];
  action: "approve" | "reject";
  note?: string;
  reason?: string;
}): Promise<OrganizerBulkReviewResponse> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/bookings/bulk-review"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    await parseError(response, `Failed to update bookings: ${response.statusText}`);
  }

  return await response.json();
}

export async function getOrganizerProfile(): Promise<OrganizerProfile> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/profile"), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch organizer profile: ${response.statusText}`);
  }

  return await response.json();
}

export async function updateOrganizerProfile(
  payload: OrganizerProfileUpdateRequest
): Promise<OrganizerProfile> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/profile"), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseError(response, `Failed to update organizer profile: ${response.statusText}`);
  }

  return await response.json();
}

export async function submitOrganizerVerification(): Promise<OrganizerProfile> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/profile/verification/submit"), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await parseError(response, `Failed to submit verification: ${response.statusText}`);
  }

  return await response.json();
}

export async function getOrganizerOverview(): Promise<OrganizerOverview> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/overview"), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch organizer overview: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    gross_bookings: numericValue(data.gross_bookings),
    pending_balance: numericValue(data.pending_balance),
    available_balance: numericValue(data.available_balance),
    next_payout_amount: numericValue(data.next_payout_amount),
  };
}

export async function getOrganizerFinanceSummary(): Promise<OrganizerFinanceSummary> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/finance/summary"), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch finance summary: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    gross_bookings: numericValue(data.gross_bookings),
    platform_fees: numericValue(data.platform_fees),
    refunds: numericValue(data.refunds),
    pending_balance: numericValue(data.pending_balance),
    available_balance: numericValue(data.available_balance),
    paid_out_total: numericValue(data.paid_out_total),
    net_earnings: numericValue(data.net_earnings),
    next_payout_amount: numericValue(data.next_payout_amount),
  };
}

export async function getOrganizerLedger(params: {
  page?: number;
  page_size?: number;
} = {}): Promise<OrganizerLedgerPage> {
  const url = new URL(buildApiUrl("/api/v1/organizer/finance/ledger"));
  if (params.page) {
    url.searchParams.set("page", String(params.page));
  }
  if (params.page_size) {
    url.searchParams.set("page_size", String(params.page_size));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch ledger: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    items: (data.items || []).map((item: OrganizerLedgerEntry) => ({
      ...item,
      amount: numericValue(item.amount),
    })),
  };
}

export async function getOrganizerPayouts(params: {
  page?: number;
  page_size?: number;
} = {}): Promise<OrganizerPayoutsPage> {
  const url = new URL(buildApiUrl("/api/v1/organizer/finance/payouts"));
  if (params.page) {
    url.searchParams.set("page", String(params.page));
  }
  if (params.page_size) {
    url.searchParams.set("page_size", String(params.page_size));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, `Failed to fetch payouts: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    items: (data.items || []).map((item: OrganizerPayout) => ({
      ...item,
      amount: numericValue(item.amount),
    })),
  };
}

export async function requestOrganizerPayout(note?: string): Promise<OrganizerPayout> {
  const response = await fetch(buildApiUrl("/api/v1/organizer/finance/payouts/request"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ note }),
  });

  if (!response.ok) {
    await parseError(response, `Failed to request payout: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    amount: numericValue(data.amount),
  };
}

export async function addOfflineBooking(
  tripId: string,
  payload: OfflineBookingRequest
): Promise<{ message: string }> {
  const response = await fetch(buildApiUrl(`/api/v1/bookings/trips/${tripId}/offline-booking`), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseError(response, `Failed to add offline booking: ${response.statusText}`);
  }

  return await response.json();
}

