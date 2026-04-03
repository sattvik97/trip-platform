"use client";

import { PaymentAttempt } from "@/src/lib/api/payments";
import { formatAmount, formatDateTime } from "@/src/lib/bookingFinance";
import { PaymentStatusBadge } from "./StatusBadges";

interface PaymentAttemptsListProps {
  attempts: PaymentAttempt[];
  isLoading?: boolean;
  onViewEvents?: (payment: PaymentAttempt) => void;
  title?: string;
  emptyState?: string;
}

export function PaymentAttemptsList({
  attempts,
  isLoading = false,
  onViewEvents,
  title = "Payment Attempts",
  emptyState = "No payment attempts yet.",
}: PaymentAttemptsListProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            Every payment attempt is tracked for audit and support workflows.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Loading payment attempts...
        </div>
      ) : attempts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          {emptyState}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Provider
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">{attempt.provider}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {formatAmount(attempt.amount, attempt.currency)}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <PaymentStatusBadge status={attempt.status} />
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">
                    {formatDateTime(attempt.created_at)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm">
                    {onViewEvents ? (
                      <button
                        type="button"
                        onClick={() => onViewEvents(attempt)}
                        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View Events
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
