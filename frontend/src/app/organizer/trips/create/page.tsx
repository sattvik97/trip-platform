"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createTrip, ItineraryItem, TripTag } from "@/src/lib/api/organizer";
import { getToken } from "@/src/lib/auth";

const TRIP_TAGS: TripTag[] = [
  "TREK",
  "BACKPACKING",
  "STARGAZING",
  "RELAXING",
  "ADVENTURE",
  "SOLO",
  "GROUP",
  "WOMEN_ONLY",
  "WOMEN_FRIENDLY",
  "BEGINNER_FRIENDLY",
  "WEEKEND",
  "MULTI_DAY",
  "HIGH_ALTITUDE",
  "CULTURAL_EXPERIENCE",
  "NATURE_RETREAT",
  "PHOTOGRAPHY",
  "INSTAGRAMMABLE",
  "BUDGET",
  "MID_RANGE",
  "PREMIUM",
];

export default function CreateTripPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<TripTag[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate number of days
  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  // Initialize/update itinerary when dates change
  useEffect(() => {
    if (numberOfDays > 0) {
      const newItinerary: ItineraryItem[] = [];
      for (let i = 1; i <= numberOfDays; i++) {
        // Preserve existing data if available
        const existing = itinerary.find((item) => item.day === i);
        newItinerary.push({
          day: i,
          title: existing?.title || "",
          description: existing?.description || "",
        });
      }
      setItinerary(newItinerary);
    } else {
      setItinerary([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfDays]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/organizer/login");
    }
  }, [router]);

  const updateItineraryItem = (day: number, field: "title" | "description", value: string) => {
    setItinerary((prev) =>
      prev.map((item) => (item.day === day ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Basic field validation
    if (!title || !location || !startDate || !endDate || !price || !totalSeats) {
      setError("Please fill in all required fields");
      return;
    }

    const priceNum = parseInt(price, 10);
    const seatsNum = parseInt(totalSeats, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number");
      return;
    }

    if (isNaN(seatsNum) || seatsNum <= 0) {
      setError("Total seats must be a positive number");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("End date must be after start date");
      return;
    }

    // Itinerary validation
    if (numberOfDays === 0) {
      setError("Invalid date range");
      return;
    }

    if (itinerary.length !== numberOfDays) {
      setError("Itinerary must have an entry for each day");
      return;
    }

    // Validate each itinerary item
    for (const item of itinerary) {
      if (!item.title.trim()) {
        setError(`Day ${item.day} title is required`);
        return;
      }
      if (!item.description.trim()) {
        setError(`Day ${item.day} description is required`);
        return;
      }
    }

    setIsLoading(true);

    try {
      await createTrip({
        title,
        destination: location,
        start_date: startDate,
        end_date: endDate,
        price: priceNum,
        total_seats: seatsNum,
        description: description || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        itinerary: itinerary.length > 0 ? itinerary : undefined,
      });
      router.push("/organizer/dashboard");
    } catch (err) {
      if (err instanceof Error && err.message === "Authentication failed") {
        router.push("/organizer/login");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create trip");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Trip</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details to create a new trip
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  id="start_date"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="end_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date *
                </label>
                <input
                  type="date"
                  id="end_date"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  Price (INR) *
                </label>
                <input
                  type="number"
                  id="price"
                  required
                  min="1"
                  step="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="total_seats"
                  className="block text-sm font-medium text-gray-700"
                >
                  Total Seats *
                </label>
                <input
                  type="number"
                  id="total_seats"
                  required
                  min="1"
                  step="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tags Section */}
            <div>
              <label
                htmlFor="tags-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tags
              </label>
              <select
                id="tags-select"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value=""
                onChange={(e) => {
                  const tag = e.target.value as TripTag;
                  if (tag && !selectedTags.includes(tag)) {
                    setSelectedTags([...selectedTags, tag]);
                  }
                  e.target.value = ""; // Reset dropdown
                }}
              >
                <option value="">Select a tag to add</option>
                {TRIP_TAGS.filter((tag) => !selectedTags.includes(tag)).map(
                  (tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  )
                )}
              </select>
              {selectedTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTags(
                            selectedTags.filter((t) => t !== tag)
                          );
                        }}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-200 focus:text-indigo-500"
                      >
                        <span className="sr-only">Remove {tag}</span>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Itinerary Section */}
            {numberOfDays > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Trip Itinerary ({numberOfDays} {numberOfDays === 1 ? "day" : "days"})
                </h3>
                <div className="space-y-4">
                  {itinerary.map((item) => (
                    <div
                      key={item.day}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Day {item.day}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor={`itinerary-day-${item.day}-title`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Title *
                          </label>
                          <input
                            type="text"
                            id={`itinerary-day-${item.day}-title`}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={item.title}
                            onChange={(e) =>
                              updateItineraryItem(item.day, "title", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`itinerary-day-${item.day}-description`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description *
                          </label>
                          <textarea
                            id={`itinerary-day-${item.day}-description`}
                            rows={3}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={item.description}
                            onChange={(e) =>
                              updateItineraryItem(
                                item.day,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/organizer/dashboard")}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Trip"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
