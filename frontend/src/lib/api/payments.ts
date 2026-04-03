import { getToken } from "../auth";
import { getUserToken } from "../userAuth";
import { buildApiUrl } from "./config";

export type BookingStatus = "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | string;
export type PaymentStatus =
  | "NOT_INITIATED"
  | "ORDER_CREATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | string;

export interface PaymentAttempt {
  id: number;
  booking_id: string;
  provider: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider_signature: string | null;
  raw_provider_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: number;
  payment_id: number;
  event_type: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

export interface RefundTriggerResponse {
  accepted: boolean;
  message: string;
  payment?: PaymentAttempt | null;
}

export interface PaymentCreateResponse {
  payment: PaymentAttempt;
  order: {
    order_id: string;
    amount: number;
    currency: string;
    provider: string;
  };
}

export interface PaginatedPayments {
  items: PaymentAttempt[];
  total: number;
  page: number;
  page_size: number;
}

export interface PaymentQueryOptions {
  booking_id?: string;
  booking_ids?: string[];
  payment_status?: PaymentStatus | "";
  page?: number;
  page_size?: number;
}

function getAuthHeaders(preferUser = true): HeadersInit {
  const userToken = getUserToken();
  const organizerToken = getToken();
  const token = preferUser ? (userToken || organizerToken) : (organizerToken || userToken);
  if (!token) {
    throw new Error("Not authenticated");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizePaymentAttempt(raw: unknown): PaymentAttempt {
  const input = (raw as Record<string, unknown>) || {};
  const amountValue = input.amount;
  const normalizedAmount =
    typeof amountValue === "number"
      ? amountValue
      : typeof amountValue === "string"
      ? Number(amountValue)
      : 0;

  return {
    id: Number(input.id ?? 0),
    booking_id: String(input.booking_id ?? ""),
    provider: String(input.provider ?? "UNKNOWN"),
    provider_order_id: String(input.provider_order_id ?? ""),
    provider_payment_id:
      input.provider_payment_id === null || input.provider_payment_id === undefined
        ? null
        : String(input.provider_payment_id),
    amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
    currency: String(input.currency ?? "INR"),
    status: String(input.status ?? "PENDING"),
    provider_signature:
      input.provider_signature === null || input.provider_signature === undefined
        ? null
        : String(input.provider_signature),
    raw_provider_response:
      input.raw_provider_response && typeof input.raw_provider_response === "object"
        ? (input.raw_provider_response as Record<string, unknown>)
        : null,
    created_at: String(input.created_at ?? ""),
    updated_at: String(input.updated_at ?? input.created_at ?? ""),
  };
}

function parsePaymentArrayPayload(payload: unknown): PaymentAttempt[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.map(normalizePaymentAttempt);
}

function parsePaymentEventsPayload(payload: unknown, paymentId: number): PaymentEvent[] {
  const rows =
    payload && typeof payload === "object" && "items" in (payload as object)
      ? ((payload as { items?: unknown[] }).items || [])
      : payload;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((event) => {
    const raw = (event as Record<string, unknown>) || {};
    return {
      id: Number(raw.id ?? 0),
      payment_id: Number(raw.payment_id ?? paymentId),
      event_type: String(raw.event_type ?? "UNKNOWN"),
      raw_payload:
        raw.raw_payload && typeof raw.raw_payload === "object"
          ? (raw.raw_payload as Record<string, unknown>)
          : {},
      created_at: String(raw.created_at ?? ""),
    };
  });
}

function buildPaymentQuery(options: PaymentQueryOptions): string {
  const params = new URLSearchParams();
  if (options.booking_id) {
    params.set("booking_id", options.booking_id);
  }
  if (options.booking_ids && options.booking_ids.length > 0) {
    params.set("booking_ids", options.booking_ids.join(","));
  }
  if (options.payment_status) {
    params.set("payment_status", options.payment_status);
  }
  if (options.page) {
    params.set("page", String(options.page));
  }
  if (options.page_size) {
    params.set("page_size", String(options.page_size));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listPayments(options: PaymentQueryOptions): Promise<PaymentAttempt[]> {
  const response = await fetch(buildApiUrl(`/api/v1/payments${buildPaymentQuery(options)}`), {
    method: "GET",
    headers: getAuthHeaders(false),
    cache: "no-store",
  });

  // Fallback-safe behavior for environments where list endpoint isn't available yet.
  if (response.status === 404 || response.status === 405) {
    return [];
  }

  if (!response.ok) {
    const errorData = await parseJsonSafe<{ detail?: string }>(response);
    throw new Error(errorData?.detail || `Failed to load payments: ${response.statusText}`);
  }

  const data = await parseJsonSafe<unknown>(response);
  return parsePaymentArrayPayload(data);
}

export async function listPaymentsByBookingIds(
  bookingIds: string[]
): Promise<Record<string, PaymentAttempt[]>> {
  if (bookingIds.length === 0) {
    return {};
  }

  try {
    const batchResults = await listPayments({ booking_ids: bookingIds });
    if (batchResults.length > 0) {
      return batchResults.reduce<Record<string, PaymentAttempt[]>>((acc, payment) => {
        const key = payment.booking_id;
        const list = acc[key] || [];
        list.push(payment);
        acc[key] = list;
        return acc;
      }, {});
    }
  } catch {
    // Fall through to per-booking fallback.
  }

  const results = await Promise.all(
    bookingIds.map(async (bookingId) => {
      const attempts = await listPayments({ booking_id: bookingId });
      return [bookingId, attempts] as const;
    })
  );

  return results.reduce<Record<string, PaymentAttempt[]>>((acc, [bookingId, attempts]) => {
    acc[bookingId] = attempts;
    return acc;
  }, {});
}

export async function verifyPayment(params: {
  payment_id: number;
  provider_payment_id?: string;
  provider_signature?: string;
  payload?: Record<string, unknown>;
}): Promise<PaymentAttempt> {
  const response = await fetch(buildApiUrl("/api/v1/payments/verify"), {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      payment_id: params.payment_id,
      provider_payment_id: params.provider_payment_id ?? `mock_pay_${params.payment_id}`,
      provider_signature: params.provider_signature ?? "mock_sig",
      payload: params.payload ?? {},
    }),
  });

  if (!response.ok) {
    const errorData = await parseJsonSafe<{ detail?: string }>(response);
    throw new Error(errorData?.detail || `Failed to verify payment: ${response.statusText}`);
  }

  const data = await parseJsonSafe<unknown>(response);
  return normalizePaymentAttempt(data);
}

export async function createPaymentAttempt(bookingId: string): Promise<PaymentCreateResponse> {
  const response = await fetch(buildApiUrl("/api/v1/payments"), {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ booking_id: bookingId }),
  });

  if (!response.ok) {
    const errorData = await parseJsonSafe<{ detail?: string | { message?: string } }>(response);
    const detail = errorData?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail && typeof detail === "object" && "message" in detail
        ? String((detail as { message?: string }).message || "Failed to create payment attempt")
        : "Failed to create payment attempt";
    throw new Error(message);
  }

  const data = await parseJsonSafe<{
    payment: unknown;
    order: { order_id: string; amount: number | string; currency: string; provider: string };
  }>(response);

  if (!data) {
    throw new Error("Invalid payment response");
  }

  return {
    payment: normalizePaymentAttempt(data.payment),
    order: {
      order_id: data.order.order_id,
      amount: Number(data.order.amount),
      currency: data.order.currency,
      provider: data.order.provider,
    },
  };
}

export async function getPaymentEvents(paymentId: number): Promise<PaymentEvent[]> {
  const endpoints = [
    `/api/v1/admin/payments/${paymentId}/events`,
    `/api/v1/payments/${paymentId}/events`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(buildApiUrl(endpoint), {
      method: "GET",
      headers: getAuthHeaders(false),
      cache: "no-store",
    });

    if (response.status === 404 || response.status === 405) {
      continue;
    }
    if (!response.ok) {
      const errorData = await parseJsonSafe<{ detail?: string }>(response);
      throw new Error(errorData?.detail || `Failed to load payment events: ${response.statusText}`);
    }

    const payload = await parseJsonSafe<unknown>(response);
    return parsePaymentEventsPayload(payload, paymentId);
  }

  return [];
}

export async function listAdminPayments(options: PaymentQueryOptions): Promise<PaginatedPayments> {
  const query = buildPaymentQuery(options);
  const endpoints = [`/api/v1/admin/payments${query}`, `/api/v1/payments${query}`];

  for (const endpoint of endpoints) {
    const response = await fetch(buildApiUrl(endpoint), {
      method: "GET",
      headers: getAuthHeaders(false),
      cache: "no-store",
    });

    if (response.status === 404 || response.status === 405) {
      continue;
    }

    if (!response.ok) {
      const errorData = await parseJsonSafe<{ detail?: string }>(response);
      throw new Error(errorData?.detail || `Failed to load admin payments: ${response.statusText}`);
    }

    const payload = await parseJsonSafe<unknown>(response);
    if (payload && typeof payload === "object" && "items" in (payload as object)) {
      const data = payload as {
        items: unknown[];
        total?: number;
        page?: number;
        page_size?: number;
      };
      return {
        items: parsePaymentArrayPayload(data.items || []),
        total: Number(data.total ?? 0),
        page: Number(data.page ?? options.page ?? 1),
        page_size: Number(data.page_size ?? options.page_size ?? 20),
      };
    }

    const attempts = parsePaymentArrayPayload(payload);
    return {
      items: attempts,
      total: attempts.length,
      page: options.page ?? 1,
      page_size: options.page_size ?? (attempts.length || 20),
    };
  }

  return {
    items: [],
    total: 0,
    page: options.page ?? 1,
    page_size: options.page_size ?? 20,
  };
}

export async function triggerManualRefund(
  paymentId: number,
  payload: { reason?: string } = {}
): Promise<RefundTriggerResponse> {
  const endpoints = [
    `/api/v1/admin/payments/${paymentId}/refund`,
    `/api/v1/payments/${paymentId}/refund`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(buildApiUrl(endpoint), {
      method: "POST",
      headers: getAuthHeaders(false),
      body: JSON.stringify(payload),
    });

    if (response.status === 404 || response.status === 405) {
      continue;
    }

    if (!response.ok) {
      const errorData = await parseJsonSafe<{ detail?: string }>(response);
      throw new Error(errorData?.detail || `Failed to trigger refund: ${response.statusText}`);
    }

    const data = await parseJsonSafe<unknown>(response);
    const asObject = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const paymentRaw =
      asObject.payment && typeof asObject.payment === "object"
        ? normalizePaymentAttempt(asObject.payment)
        : null;

    return {
      accepted: true,
      message: String(asObject.message ?? "Refund requested successfully"),
      payment: paymentRaw,
    };
  }

  return {
    accepted: false,
    message: "Refund endpoint is unavailable in this environment",
    payment: null,
  };
}
