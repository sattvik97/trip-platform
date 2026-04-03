"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listAdminPayments,
  PaginatedPayments,
  PaymentAttempt,
  PaymentStatus,
} from "@/src/lib/api/payments";

export type AdminPaymentStatusFilter = PaymentStatus | "";

interface UseAdminPaymentsOptions {
  initialPageSize?: number;
  enabled?: boolean;
}

interface UseAdminPaymentsResult {
  payments: PaymentAttempt[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusFilter: AdminPaymentStatusFilter;
  isLoading: boolean;
  error: string;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setStatusFilter: (status: AdminPaymentStatusFilter) => void;
  refresh: () => Promise<void>;
}

export function useAdminPayments({
  initialPageSize = 20,
  enabled = true,
}: UseAdminPaymentsOptions = {}): UseAdminPaymentsResult {
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [statusFilter, setStatusFilter] = useState<AdminPaymentStatusFilter>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!enabled) {
      setPayments([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response: PaginatedPayments = await listAdminPayments({
        payment_status: statusFilter,
        page,
        page_size: pageSize,
      });

      setPayments(response.items);
      setTotal(response.total);

      // If requested page is now out of bounds due to backend-side filters,
      // clamp to page 1 and retry once to keep UI state coherent.
      const computedTotalPages = Math.max(1, Math.ceil((response.total || 0) / pageSize));
      if (page > computedTotalPages) {
        setPage(1);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
      setPayments([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page, pageSize, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const updatePage = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage));
  }, []);

  const updatePageSize = useCallback((size: number) => {
    const normalized = Number.isFinite(size) && size > 0 ? Math.floor(size) : initialPageSize;
    setPageSize(normalized);
    setPage(1);
  }, [initialPageSize]);

  const updateStatusFilter = useCallback((status: AdminPaymentStatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  return {
    payments,
    total,
    page,
    pageSize,
    totalPages,
    statusFilter,
    isLoading,
    error,
    setPage: updatePage,
    setPageSize: updatePageSize,
    setStatusFilter: updateStatusFilter,
    refresh: load,
  };
}
