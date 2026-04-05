"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OrganizerFinanceSummary,
  OrganizerLedgerPage,
  OrganizerPayoutsPage,
  getOrganizerFinanceSummary,
  getOrganizerLedger,
  getOrganizerPayouts,
  requestOrganizerPayout,
} from "@/src/lib/api/organizer";
import { getToken } from "@/src/lib/auth";
import { formatAmount, formatDateTime } from "@/src/lib/bookingFinance";
import {
  OrganizerMetricCard,
  OrganizerWorkspaceShell,
} from "@/src/components/organizer/OrganizerWorkspaceShell";

function statusTone(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-800";
    case "PAID_OUT":
      return "bg-slate-200 text-slate-700";
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "PAID":
      return "bg-emerald-100 text-emerald-800";
    case "SCHEDULED":
      return "bg-sky-100 text-sky-800";
    case "PROCESSING":
      return "bg-amber-100 text-amber-800";
    case "FAILED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not scheduled";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrganizerFinancePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<OrganizerFinanceSummary | null>(null);
  const [ledgerPage, setLedgerPage] = useState<OrganizerLedgerPage | null>(null);
  const [payoutPage, setPayoutPage] = useState<OrganizerPayoutsPage | null>(null);
  const [ledgerPageNumber, setLedgerPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [financeSummary, ledger, payouts] = await Promise.all([
        getOrganizerFinanceSummary(),
        getOrganizerLedger({ page: ledgerPageNumber, page_size: 12 }),
        getOrganizerPayouts({ page: 1, page_size: 8 }),
      ]);
      setSummary(financeSummary);
      setLedgerPage(ledger);
      setPayoutPage(payouts);
    } catch (err) {
      if (err instanceof Error && err.message === "Authentication failed") {
        router.push("/organizer/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load organizer finance");
    } finally {
      setIsLoading(false);
    }
  }, [ledgerPageNumber, router]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/organizer/login");
      return;
    }

    void refresh();
  }, [refresh, router]);

  const handleRequestPayout = async () => {
    setIsRequestingPayout(true);
    setError("");
    setSuccess("");
    try {
      const payout = await requestOrganizerPayout("Requested from organizer finance workspace");
      setSuccess(`Payout ${payout.reference || `#${payout.id}`} has been scheduled.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request payout");
    } finally {
      setIsRequestingPayout(false);
    }
  };

  return (
    <OrganizerWorkspaceShell
      title="Net earnings, payout timing, and every money movement in one ledger"
      description="Move beyond payment attempts and give organizers a true finance view: what came in, what got held, what got refunded, and what is ready for payout."
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Refresh finance
          </button>
          <button
            type="button"
            onClick={() => void handleRequestPayout()}
            disabled={
              isRequestingPayout ||
              !summary?.payout_setup_complete ||
              (summary?.available_balance || 0) <= 0
            }
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isRequestingPayout ? "Scheduling..." : "Request payout"}
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {isLoading || !summary || !ledgerPage || !payoutPage ? (
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-10 text-center text-sm text-slate-500 shadow-lg shadow-slate-950/5">
          Loading finance data...
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <OrganizerMetricCard
              label="Gross bookings"
              value={formatAmount(summary.gross_bookings, "INR")}
              helper="Traveler revenue captured before fees and refunds."
            />
            <OrganizerMetricCard
              label="Platform fees"
              value={formatAmount(summary.platform_fees, "INR")}
              helper="Current fee total withheld by the platform."
            />
            <OrganizerMetricCard
              label="Refunds"
              value={formatAmount(summary.refunds, "INR")}
              helper="Refunded gross value already reversed from earnings."
            />
            <OrganizerMetricCard
              label="Available payout"
              value={formatAmount(summary.available_balance, "INR")}
              helper="Net balance that can be moved into the next payout."
            />
            <OrganizerMetricCard
              label="Paid out"
              value={formatAmount(summary.paid_out_total, "INR")}
              helper="Balance already assigned to past or scheduled payouts."
            />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
                <h2 className="text-xl font-semibold text-slate-950">Payout readiness</h2>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-3xl bg-[#f7f1e8] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Next payout release
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {formatAmount(summary.next_payout_amount, "INR")}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateLabel(summary.next_payout_date)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-950">Settlement method</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {summary.payout_setup_complete
                        ? `${summary.payout_method || "Configured"} - ${summary.payout_reference || "Reference on file"}`
                        : "No payout destination is configured yet."}
                    </p>
                    {!summary.payout_setup_complete && (
                      <button
                        type="button"
                        onClick={() => router.push("/organizer/profile")}
                        className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                      >
                        Complete payout setup
                      </button>
                    )}
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-950">Still in hold window</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {formatAmount(summary.pending_balance, "INR")}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      These funds will become available after the payout delay clears.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
                <h2 className="text-xl font-semibold text-slate-950">Payouts</h2>
                <div className="mt-5 grid gap-3">
                  {payoutPage.items.length === 0 ? (
                    <div className="rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-600">
                      No payouts have been scheduled yet.
                    </div>
                  ) : (
                    payoutPage.items.map((payout) => (
                      <article key={payout.id} className="rounded-3xl border border-slate-200 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {payout.reference || `Payout #${payout.id}`}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {formatAmount(payout.amount, payout.currency)}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(payout.status)}`}>
                            {payout.status}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Scheduled {formatDateLabel(payout.scheduled_for)}
                          {payout.paid_at ? ` - Paid ${formatDateLabel(payout.paid_at)}` : ""}
                        </p>
                        {payout.notes && (
                          <p className="mt-2 text-sm text-slate-600">{payout.notes}</p>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Ledger</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Every payment, fee, refund, and payout release is visible here so organizers can
                    reconcile what changed and why.
                  </p>
                </div>
                <div className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                  Net earnings {formatAmount(summary.net_earnings, "INR")}
                </div>
              </div>

              {ledgerPage.items.length === 0 ? (
                <div className="mt-5 rounded-3xl bg-[#f7f1e8] p-5 text-sm text-slate-600">
                  Ledger entries will appear here once bookings are paid or refunded.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Type", "Description", "Occurred", "Available on", "Status", "Amount"].map((header) => (
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
                      {ledgerPage.items.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                            {entry.entry_type.replaceAll("_", " ")}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {entry.description || "Finance event"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDateTime(entry.occurred_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {entry.available_on ? formatDateLabel(entry.available_on) : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(entry.status)}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                            {formatAmount(entry.amount, entry.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
                <p>
                  Page {ledgerPage.page} of{" "}
                  {Math.max(1, Math.ceil((ledgerPage.total || 0) / (ledgerPage.page_size || 12)))}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLedgerPageNumber((current) => Math.max(1, current - 1))}
                    disabled={ledgerPage.page <= 1}
                    className="rounded-full border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLedgerPageNumber((current) =>
                        current >= Math.max(1, Math.ceil((ledgerPage.total || 0) / (ledgerPage.page_size || 12)))
                          ? current
                          : current + 1
                      )
                    }
                    disabled={
                      ledgerPage.page >=
                      Math.max(1, Math.ceil((ledgerPage.total || 0) / (ledgerPage.page_size || 12)))
                    }
                    className="rounded-full border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </OrganizerWorkspaceShell>
  );
}

