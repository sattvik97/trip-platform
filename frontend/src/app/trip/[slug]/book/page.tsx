"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { getTripBySlug, createBookingRequest } from "@/src/lib/api/trips";
import type { Trip } from "@/src/types/trip";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  formatPriceInr,
  formatSeatCopy,
  formatTripDateRange,
} from "@/src/lib/tripPresentation";

interface TravelerDetail {
  name: string;
  age: number;
  gender: string;
  profession: string;
}

function formatDateRange(startDate: string, endDate: string): string {
  return formatTripDateRange(startDate, endDate, "short");

  const start = new Date(startDate);
  const end = new Date(endDate);
  const startFormatted = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endFormatted = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFormatted} – ${endFormatted}`;
}

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const slug = params?.slug as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Traveler details
  const [numTravelers, setNumTravelers] = useState(1);
  const [travelers, setTravelers] = useState<TravelerDetail[]>([
    { name: "", age: 0, gender: "", profession: "" },
  ]);

  // Contact details
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchTrip = async () => {
      try {
        const tripData = await getTripBySlug(slug);
        if (!tripData) {
          notFound();
        }
        setTrip(tripData);
        if (user?.email) {
          setContactEmail(user.email);
          setContactName((currentName) => {
            if (currentName) {
              return currentName;
            }

            const [rawName] = user.email.split("@");
            return rawName
              .split(/[._-]/)
              .filter(Boolean)
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchTrip();
    }
  }, [slug, isAuthenticated, user, router]);

  useEffect(() => {
    // Update travelers array when numTravelers changes
    setTravelers((currentTravelers) =>
      Array.from({ length: numTravelers }, (_, i) => {
        return currentTravelers[i] || { name: "", age: 0, gender: "", profession: "" };
      })
    );
  }, [numTravelers]);

  const updateTraveler = (index: number, field: keyof TravelerDetail, value: string | number) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!trip) return;

    // Validate travelers
    for (let i = 0; i < travelers.length; i++) {
      const traveler = travelers[i];
      if (!traveler.name.trim()) {
        setError(`Traveler ${i + 1}: Name is required`);
        return;
      }
      if (!traveler.age || traveler.age <= 0) {
        setError(`Traveler ${i + 1}: Valid age is required`);
        return;
      }
      if (!traveler.gender.trim()) {
        setError(`Traveler ${i + 1}: Gender is required`);
        return;
      }
    }

    // Validate contact details
    if (!contactName.trim()) {
      setError("Contact name is required");
      return;
    }
    if (!contactPhone.trim()) {
      setError("Contact phone is required");
      return;
    }
    if (!contactEmail.trim()) {
      setError("Contact email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalPrice = trip.price * numTravelers;
      const response = await createBookingRequest(trip.id, {
        num_travelers: numTravelers,
        travelers: travelers.map((t) => ({
          name: t.name,
          age: t.age,
          gender: t.gender,
          profession: t.profession || undefined,
        })),
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        price_per_person: trip.price,
        total_price: totalPrice,
        currency: "INR",
      });

      // Redirect to booking confirmation page
      router.push(`/bookings/${response.booking_id}/confirmation`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!trip) {
    notFound();
  }

  const dateRange = formatDateRange(trip.start_date, trip.end_date);
  const totalPrice = trip.price * numTravelers;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5efe6]">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Booking request
            </p>
            <h1 className="font-display text-4xl font-semibold text-slate-950">
              Request your place on {trip.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              You are not paying on this screen. You are sending the organizer a complete request so they can confirm the group fit and lock your spot.
            </p>
          </div>

          {/* Trip Summary */}
          <div className="mb-6 grid gap-4 rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trip</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{trip.title}</p>
            </div>
            <div className="hidden space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Destination:</span> {trip.destination}
              </p>
              <p>
                <span className="font-medium">Dates:</span> {dateRange}
              </p>
              <p>
                <span className="font-medium">Price per person:</span> ₹
                {trip.price.toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Seats available:</span> {trip.available_seats}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Destination</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{trip.destination}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dates</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{dateRange}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Price and seats</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{formatPriceInr(trip.price)}</p>
              <p className="mt-1 text-sm text-slate-600">{formatSeatCopy(trip.available_seats)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Number of Travelers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Number of Travelers
              </h2>
              <div>
                <label htmlFor="numTravelers" className="block text-sm font-medium text-gray-700 mb-2">
                  How many people are traveling?
                </label>
                <select
                  id="numTravelers"
                  value={numTravelers}
                  onChange={(e) => setNumTravelers(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {Array.from({ length: Math.min(10, trip.available_seats) }, (_, i) => i + 1).map(
                    (num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "person" : "people"}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Traveler Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Traveler Details
              </h2>
              <div className="space-y-6">
                {travelers.map((traveler, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Traveler {index + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`traveler-${index}-name`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`traveler-${index}-name`}
                          type="text"
                          required
                          value={traveler.name}
                          onChange={(e) =>
                            updateTraveler(index, "name", e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`traveler-${index}-age`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Age <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`traveler-${index}-age`}
                          type="number"
                          required
                          min="1"
                          max="120"
                          value={traveler.age || ""}
                          onChange={(e) =>
                            updateTraveler(index, "age", parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`traveler-${index}-gender`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`traveler-${index}-gender`}
                          required
                          value={traveler.gender}
                          onChange={(e) =>
                            updateTraveler(index, "gender", e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor={`traveler-${index}-profession`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Profession (Optional)
                        </label>
                        <input
                          id={`traveler-${index}-profession`}
                          type="text"
                          value={traveler.profession}
                          onChange={(e) =>
                            updateTraveler(index, "profession", e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Contact Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Primary Contact Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="contactEmail"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Price Breakdown</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Price per person:</span>
                  <span className="font-medium">₹{trip.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Number of travelers:</span>
                  <span className="font-medium">{numTravelers}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Price:</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-950/5">
              <h2 className="text-xl font-bold text-slate-950 mb-4">What happens after this?</h2>
              <div className="space-y-3 text-sm leading-7 text-slate-600">
                <p>1. Your request reaches the organizer with all traveler and contact details.</p>
                <p>2. The organizer reviews group fit and confirms there is still enough approved capacity.</p>
                <p>3. You get a clear confirmed or declined outcome inside your booking hub.</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-slate-950 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Sending request..." : "Send booking request"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

