"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Footer } from "@/src/components/layout/Footer";
import { Header } from "@/src/components/layout/Header";
import { getUserProfile, updateUserProfile } from "@/src/lib/api/user";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, role, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthenticated || role !== "user") {
      router.push(`/login?next=${encodeURIComponent("/account/profile")}`);
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError("");
      try {
        const profile = await getUserProfile();
        setEmail(profile.email || "");
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
      } catch (err) {
        if (err instanceof Error && err.message === "Authentication failed") {
          router.push(`/login?next=${encodeURIComponent("/account/profile")}`);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated || role !== "user") {
    return null;
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const profile = await updateUserProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5efe6]">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="mb-8 rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Traveller profile
            </p>
            <h1 className="font-display text-4xl font-semibold text-slate-950">
              Keep your booking details ready
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Update the name and phone number we use to prefill your future trip requests.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-10 text-center text-sm text-slate-500 shadow-lg shadow-slate-950/5">
              Loading your profile...
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                    placeholder="How should we address you?"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                    placeholder="Used to prefill trip requests"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save profile"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
                >
                  Logout
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
