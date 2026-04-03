"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPaymentAttempt,
  listPayments,
  PaymentAttempt,
  PaymentCreateResponse,
} from "@/src/lib/api/payments";
import { latestPaymentAttempt } from "@/src/lib/bookingFinance";

interface UseBookingPaymentsOptions {
  bookingId?: string;
  autoRefreshMs?: number;
  enabled?: boolean;
}

interface UseBookingPaymentsResult {
  attempts: PaymentAttempt[];
  latestAttempt: PaymentAttempt | null;
  isLoading: boolean;
  isRetrying: boolean;
  error: string;
  refresh: () => Promise<void>;
  retryPayment: () => Promise<PaymentCreateResponse>;
}

export function useBookingPayments({
  bookingId,
  autoRefreshMs = 0,
  enabled = true,
}: UseBookingPaymentsOptions): UseBookingPaymentsResult {
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState("");

  const fetchAttempts = useCallback(async () => {
    if (!bookingId || !enabled) {
      setAttempts([]);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const paymentAttempts = await listPayments({ booking_id: bookingId });
      const sorted = [...paymentAttempts].sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return bTime - aTime;
      });
      setAttempts(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment attempts");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, enabled]);

  useEffect(() => {
    void fetchAttempts();
  }, [fetchAttempts]);

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs <= 0 || !bookingId || !enabled) {
      return;
    }
    const timer = window.setInterval(() => {
      void fetchAttempts();
    }, autoRefreshMs);
    return () => window.clearInterval(timer);
  }, [autoRefreshMs, bookingId, enabled, fetchAttempts]);

  const retryPayment = useCallback(async () => {
    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    setIsRetrying(true);
    setError("");
    try {
      const response = await createPaymentAttempt(bookingId);
      setAttempts((prev) => [response.payment, ...prev]);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create retry payment";
      setError(message);
      throw new Error(message);
    } finally {
      setIsRetrying(false);
    }
  }, [bookingId]);

  const latestAttempt = useMemo(() => latestPaymentAttempt(attempts), [attempts]);

  return {
    attempts,
    latestAttempt,
    isLoading,
    isRetrying,
    error,
    refresh: fetchAttempts,
    retryPayment,
  };
}
