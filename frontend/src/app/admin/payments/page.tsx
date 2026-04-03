"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentStatusBadge } from "@/src/components/payments/StatusBadges";
import { useAdminPayments } from "@/src/hooks/useAdminPayments";
import {
  getPaymentEvents,
  PaymentAttempt,
  PaymentEvent,
  triggerManualRefund,
} from "@/src/lib/api/payments";
import { getToken } from "@/src/lib/auth";
import { formatAmount, formatDateTime } from "@/src/lib/bookingFinance";

const PAYMENT_STATUS_FILTERS = [
  "",
  "SUCCESS",
  "FAILED",
  "PENDING",
  "ORDER_CREATED",
  "REFUNDED",
  "NOT_INITIATED",
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function statusValue(status: string | null | undefined): string {
  return String(status || "NOT_INITIATED").toUpperCase();
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const {
    payments,
    total,
    page,
    pageSize,
    totalPages,
    statusFilter,
    isLoading,
    error,
    setPage,
    setPageSize,
    setStatusFilter,
    refresh,
  } = useAdminPayments({
    initialPageSize: 20,
    enabled: authChecked,
  });

  const [selectedPayment, setSelectedPayment] = useState<PaymentAttempt | null>(null);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState("");

  const [refundingId, setRefundingId] = useState<number | null>(null);
  const [refundMessages, setRefundMessages] = useState<Record<number, string>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<number, string>>({});

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const selectedEvent = useMemo(() => {
    if (events.length === 0) {
      return null;
    }
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  const totalSuccessAmount = useMemo(() => {
    return payments
      .filter((payment) => statusValue(statusOverrides[payment.id] || payment.status) === "SUCCESS")
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments, statusOverrides]);

  const closeEventPanel = () => {
    setSelectedPayment(null);
    setEvents([]);
    setSelectedEventId(null);
    setEventsError("");
  };

  const handleViewEvents = async (payment: PaymentAttempt) => {
    setSelectedPayment(payment);
    setLoadingEvents(true);
    setEvents([]);
    setSelectedEventId(null);
    setEventsError("");

    try {
      const eventRows = await getPaymentEvents(payment.id);
      setEvents(eventRows);
      if (eventRows.length > 0) {
        setSelectedEventId(eventRows[0].id);
      }
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : "Failed to load payment events");
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleManualRefund = async (payment: PaymentAttempt) => {
    const paymentId = payment.id;
    setRefundingId(paymentId);
    setRefundMessages((prev) => ({ ...prev, [paymentId]: "" }));

    try {
      const result = await triggerManualRefund(paymentId, {
        reason: "Manual refund requested from admin panel",
      });

      if (!result.accepted) {
        setRefundMessages((prev) => ({
          ...prev,
          [paymentId]: `${result.message}. UI action recorded.`,
        }));
        setStatusOverrides((prev) => ({ ...prev, [paymentId]: "REFUND_REQUESTED" }));
        return;
      }

      setRefundMessages((prev) => ({
        ...prev,
        [paymentId]: result.message,
      }));
      setStatusOverrides((prev) => ({
        ...prev,
        [paymentId]: statusValue(result.payment?.status || "REFUNDED"),
      }));
      await refresh();
    } catch (err) {
      setRefundMessages((prev) => ({
        ...prev,
        [paymentId]: err instanceof Error ? err.message : "Failed to trigger manual refund",
      }));
    } finally {
      setRefundingId(null);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-500">
        Checking access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Payment Panel</h1>
            <p className="mt-1 text-sm text-slate-600">
              Central visibility into payment attempts, webhook events, and refunds.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/organizer/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Organizer Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Payments</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{total}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Displayed Page</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {payments.length} / {pageSize}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Success Volume (Page)</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatAmount(totalSuccessAmount, "INR")}
            </p>
          </article>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
              <p className="text-xs text-slate-500">
                Filter by status and open payment events for webhook-level auditing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {PAYMENT_STATUS_FILTERS.filter(Boolean).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                Rows
                <select
                  value={String(pageSize)}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No payments found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Payment ID",
                      "Booking ID",
                      "Provider",
                      "Amount",
                      "Status",
                      "Order ID",
                      "Provider Payment ID",
                      "Created",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payments.map((payment) => {
                    const effectiveStatus = statusValue(
                      statusOverrides[payment.id] || payment.status
                    );
                    const isRefundable = effectiveStatus === "SUCCESS";

                    return (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{payment.id}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{payment.booking_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{payment.provider}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatAmount(payment.amount, payment.currency)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <PaymentStatusBadge status={effectiveStatus} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{payment.provider_order_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {payment.provider_payment_id || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatDateTime(payment.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleViewEvents(payment)}
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View Events
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleManualRefund(payment)}
                              disabled={!isRefundable || refundingId === payment.id}
                              className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              {refundingId === payment.id ? "Processing..." : "Manual Refund"}
                            </button>
                          </div>
                          {refundMessages[payment.id] && (
                            <p className="mt-2 max-w-xs text-xs text-slate-500">
                              {refundMessages[payment.id]}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
            <p className="text-slate-600">
              Page {page} of {totalPages} | Total rows: {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
          <aside className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-xl">
            <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Payment Events: #{selectedPayment.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Webhook history and raw payload for audit and debugging.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEventPanel}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </header>

            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1.5fr]">
              <section className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h4 className="text-sm font-semibold text-slate-900">Events</h4>
                </div>

                {loadingEvents ? (
                  <p className="p-4 text-sm text-slate-500">Loading events...</p>
                ) : eventsError ? (
                  <p className="p-4 text-sm text-rose-700">{eventsError}</p>
                ) : events.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">No events available.</p>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {events.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedEventId(event.id)}
                          className={`w-full px-4 py-3 text-left transition ${
                            selectedEvent?.id === event.id ? "bg-slate-100" : "hover:bg-slate-50"
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-900">{event.event_type}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(event.created_at)}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h4 className="text-sm font-semibold text-slate-900">Webhook Raw Payload</h4>
                </div>
                {!selectedEvent ? (
                  <p className="p-4 text-sm text-slate-500">Select an event to inspect payload.</p>
                ) : (
                  <div className="p-4">
                    <p className="mb-2 text-xs text-slate-500">
                      Event: <span className="font-semibold text-slate-700">{selectedEvent.event_type}</span>
                    </p>
                    <pre className="max-h-[28rem] overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
{JSON.stringify(selectedEvent.raw_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

