"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrganizerWorkspaceShell } from "@/src/components/organizer/OrganizerWorkspaceShell";
import { getToken } from "@/src/lib/auth";
import {
  OrganizerProfile,
  getOrganizerProfile,
  submitOrganizerVerification,
  updateOrganizerProfile,
} from "@/src/lib/api/organizer";

export default function OrganizerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutBeneficiary, setPayoutBeneficiary] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getOrganizerProfile();
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setWebsite(data.website || "");
        setBio(data.bio || "");
        setSupportEmail(data.support_email || "");
        setSupportPhone(data.support_phone || "");
        setPayoutMethod(data.payout_method || "");
        setPayoutBeneficiary(data.payout_beneficiary || "");
        setPayoutReference(data.payout_reference || "");
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push("/organizer/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load organizer profile");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [router]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateOrganizerProfile({
        name,
        phone,
        website,
        bio,
        support_email: supportEmail,
        support_phone: supportPhone,
        payout_method: payoutMethod,
        payout_beneficiary: payoutBeneficiary,
        payout_reference: payoutReference,
      });
      setProfile(updated);
      setSuccess("Organizer profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update organizer profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    setIsSubmittingVerification(true);
    setError("");
    setSuccess("");
    try {
      const updated = await submitOrganizerVerification();
      setProfile(updated);
      setSuccess("Verification submitted for review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit verification");
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  return (
    <OrganizerWorkspaceShell
      title="Build traveler trust before they ever message you"
      description="Your profile feeds publish readiness, traveler confidence, and how clearly support details show up across the product."
      actions={
        <div className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Verification: {profile?.verification_status || "UNVERIFIED"}
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

      {isLoading ? (
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-10 text-center text-sm text-slate-500 shadow-lg shadow-slate-950/5">
          Loading organizer profile...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={handleSave}
            className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Organizer name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Primary phone
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700">
                  Website
                </label>
                <input
                  id="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
                  Organizer bio
                </label>
                <textarea
                  id="bio"
                  rows={6}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                  placeholder="What kind of trips do you run, who are they for, and why should travelers trust your experience?"
                />
              </div>

              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-slate-700">
                  Support email
                </label>
                <input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                />
              </div>

              <div>
                <label htmlFor="supportPhone" className="block text-sm font-medium text-slate-700">
                  Support phone
                </label>
                <input
                  id="supportPhone"
                  value={supportPhone}
                  onChange={(event) => setSupportPhone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                />
              </div>

              <div>
                <label htmlFor="payoutMethod" className="block text-sm font-medium text-slate-700">
                  Payout method
                </label>
                <select
                  id="payoutMethod"
                  value={payoutMethod}
                  onChange={(event) => setPayoutMethod(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                >
                  <option value="">Select method</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label htmlFor="payoutBeneficiary" className="block text-sm font-medium text-slate-700">
                  Payout beneficiary
                </label>
                <input
                  id="payoutBeneficiary"
                  value={payoutBeneficiary}
                  onChange={(event) => setPayoutBeneficiary(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                  placeholder="Account holder or UPI beneficiary name"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="payoutReference" className="block text-sm font-medium text-slate-700">
                  Payout reference
                </label>
                <input
                  id="payoutReference"
                  value={payoutReference}
                  onChange={(event) => setPayoutReference(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                  placeholder="UPI ID or bank account reference"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-8 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save organizer profile"}
            </button>
          </form>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
              <h2 className="text-xl font-semibold text-slate-950">Publish readiness</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Trips publish more cleanly when your support and identity details are filled out first.
              </p>
              <div className="mt-5 h-2 rounded-full bg-[#f7f1e8]">
                <div
                  className="h-2 rounded-full bg-slate-950"
                  style={{ width: `${profile?.profile_completion_percent || 0}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">
                {profile?.profile_completion_percent || 0}% complete
              </p>
              <div className="mt-4 grid gap-2">
                {(profile?.missing_profile_items || []).map((item) => (
                  <p key={item} className="text-sm text-slate-600">
                    - {item}
                  </p>
                ))}
                {(profile?.missing_profile_items || []).length === 0 && (
                  <p className="text-sm text-emerald-700">Your profile is ready for publishing.</p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Verification checklist</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Complete every required item, then submit your organizer profile for review.
                  </p>
                </div>
                <span className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                  {profile?.verification_status || "UNVERIFIED"}
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {(profile?.verification_checklist || []).map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-3xl border p-4 ${
                      item.completed
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-[#f7f1e8]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {profile?.verification_notes || "No verification updates yet."}
              </p>

              <button
                type="button"
                onClick={() => void handleSubmitVerification()}
                disabled={!profile?.can_submit_verification || isSubmittingVerification}
                className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmittingVerification ? "Submitting..." : "Submit for verification"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </OrganizerWorkspaceShell>
  );
}
