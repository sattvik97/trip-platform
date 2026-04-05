"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, FormEvent } from "react";
import { RangeSlider } from "@/src/components/search/RangeSlider";
import { FlexibleDatePicker } from "@/src/components/search/FlexibleDatePicker";
import { formatPriceInr } from "@/src/lib/tripPresentation";

type DateMode = "exact" | "flexible" | "month";

interface HeroSearchProps {
  variant?: "landing" | "inline";
  anchorId?: string;
  initialValues?: {
    q?: string;
    start_date?: string;
    end_date?: string;
    range_start?: string;
    range_end?: string;
    month?: string;
    people?: string;
    min_price?: string;
    max_price?: string;
    min_days?: string;
    max_days?: string;
  };
}

export function HeroSearch({
  variant = "landing",
  anchorId = "search-refiner",
  initialValues,
}: HeroSearchProps) {
  const router = useRouter();
  const hasInitialFilters = useMemo(
    () =>
      Boolean(
        initialValues?.q ||
          initialValues?.start_date ||
          initialValues?.end_date ||
          initialValues?.range_start ||
          initialValues?.range_end ||
          initialValues?.month ||
          initialValues?.people ||
          initialValues?.min_price ||
          initialValues?.max_price ||
          initialValues?.min_days ||
          initialValues?.max_days
      ),
    [initialValues]
  );

  const initialDateMode: DateMode = initialValues?.month
    ? "month"
    : initialValues?.range_start || initialValues?.range_end
      ? "flexible"
      : "exact";

  const [showAdvanced, setShowAdvanced] = useState(variant === "inline" || hasInitialFilters);
  const [searchQuery, setSearchQuery] = useState(initialValues?.q || "");
  const [dateMode, setDateMode] = useState<DateMode>(initialDateMode);
  const [exactStartDate, setExactStartDate] = useState(initialValues?.start_date || "");
  const [exactEndDate, setExactEndDate] = useState(initialValues?.end_date || "");
  const [flexibleStartDate, setFlexibleStartDate] = useState(initialValues?.range_start || "");
  const [flexibleEndDate, setFlexibleEndDate] = useState(initialValues?.range_end || "");
  const [month, setMonth] = useState(initialValues?.month || "");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([
    initialValues?.min_price ? parseInt(initialValues.min_price, 10) : 0,
    initialValues?.max_price ? parseInt(initialValues.max_price, 10) : 100000,
  ]);
  const [durationRange, setDurationRange] = useState<[number, number]>([
    initialValues?.min_days ? parseInt(initialValues.min_days, 10) : 1,
    initialValues?.max_days ? parseInt(initialValues.max_days, 10) : 30,
  ]);
  const [people, setPeople] = useState(initialValues?.people || "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }

    if (dateMode === "month" && month) {
      params.set("month", month);
    } else if (dateMode === "flexible") {
      if (flexibleStartDate) params.set("range_start", flexibleStartDate);
      if (flexibleEndDate) params.set("range_end", flexibleEndDate);
    } else if (dateMode === "exact") {
      if (exactStartDate) params.set("start_date", exactStartDate);
      if (exactEndDate) params.set("end_date", exactEndDate);
    }

    if (budgetRange[0] > 0) {
      params.set("min_price", budgetRange[0].toString());
    }
    if (budgetRange[1] < 100000) {
      params.set("max_price", budgetRange[1].toString());
    }

    if (durationRange[0] > 1) {
      params.set("min_days", durationRange[0].toString());
    }
    if (durationRange[1] < 30) {
      params.set("max_days", durationRange[1].toString());
    }

    if (people) {
      params.set("people", people);
    }

    const queryString = params.toString();
    router.push(`/trips/search${queryString ? `?${queryString}` : ""}`);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}k`;
    }
    return `₹${value}`;
  };

  void formatPrice;

  const formatPriceLabel = (value: number) => {
    if (value === 0) {
      return "Any budget";
    }
    if (value >= 1000 && value < 100000) {
      return formatPriceInr(value).replace(",000", "k");
    }
    return formatPriceInr(value);
  };

  const quickLinks = [
    { label: "This weekend", href: "/weekend-getaways" },
    { label: "Solo-friendly", href: "/discover/solo" },
    { label: "Under 15000", href: "/trips/search?max_price=15000" },
    { label: "Trekking", href: "/discover/trekking" },
  ];

  return (
    <section
      id={anchorId}
      className={
        variant === "landing"
          ? "relative overflow-hidden border-b border-[color:var(--line)] bg-[#f7f0e7] py-16 md:py-24"
          : "rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-950/5 md:p-8"
      }
    >
      {variant === "landing" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/60 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-16 h-56 w-56 rounded-full bg-[rgba(13,95,89,0.12)] blur-3xl" />
        </>
      )}

      <div className={variant === "landing" ? "container mx-auto max-w-7xl px-4" : ""}>
        <div className={variant === "landing" ? "grid gap-10 lg:grid-cols-[1fr_0.9fr]" : ""}>
          <div className={variant === "landing" ? "max-w-2xl" : "mb-6"}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {variant === "landing" ? "Trips that feel worth planning around" : "Refine your trip search"}
            </p>
            <h1
              className={`font-display text-slate-950 ${
                variant === "landing"
                  ? "text-5xl font-semibold leading-tight md:text-6xl"
                  : "text-3xl font-semibold leading-tight md:text-4xl"
              }`}
            >
              {variant === "landing"
                ? "Find the trip that already feels like a yes."
                : "Tighten the destination, dates, and budget without starting over."}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              {variant === "landing"
                ? "Discover organizer-led group trips with live seat accuracy, stronger itinerary clarity, and less guesswork before you commit."
                : "Seat counts stay grounded in confirmed bookings, so the shortlist you are seeing is trustworthy."}
            </p>

            {variant === "landing" && (
              <>
                <div className="mt-6 flex flex-wrap gap-3">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    "Live seat counts from approved bookings",
                    "Approval-based requests for better group fit",
                    "Curated itineraries instead of thin listings",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-3xl border border-white/80 bg-white/75 px-4 py-4 text-sm leading-6 text-slate-700 shadow-lg shadow-slate-950/5"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-2xl shadow-slate-950/10 md:p-7">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Destination or trip vibe
                  </label>
                  <input
                    type="text"
                    placeholder="Try Spiti, beach, solo, premium, trek"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-[#fffdfa] px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex w-full items-center justify-between rounded-2xl bg-[#f5efe6] px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-[#ede2d3]"
                >
                  <span>{showAdvanced ? "Hide trip filters" : "Show dates, budget, and duration"}</span>
                  <svg
                    className={`h-5 w-5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showAdvanced && (
                  <div className="space-y-6 border-t border-slate-200 pt-5">
                    <div>
                      <label className="mb-3 block text-sm font-medium text-slate-700">
                        When do you want to go?
                      </label>
                      <FlexibleDatePicker
                        mode={dateMode}
                        onModeChange={setDateMode}
                        exactStartDate={exactStartDate}
                        exactEndDate={exactEndDate}
                        onExactDatesChange={(start, end) => {
                          setExactStartDate(start);
                          setExactEndDate(end);
                        }}
                        flexibleStartDate={flexibleStartDate}
                        flexibleEndDate={flexibleEndDate}
                        onFlexibleDatesChange={(start, end) => {
                          setFlexibleStartDate(start);
                          setFlexibleEndDate(end);
                        }}
                        month={month}
                        onMonthChange={setMonth}
                      />
                    </div>

                    <RangeSlider
                      min={0}
                      max={100000}
                      step={1000}
                      value={budgetRange}
                      onChange={setBudgetRange}
                      formatLabel={formatPriceLabel}
                      label="Budget"
                    />

                    <RangeSlider
                      min={1}
                      max={30}
                      step={1}
                      value={durationRange}
                      onChange={setDurationRange}
                      formatLabel={(value) => `${value} ${value === 1 ? "day" : "days"}`}
                      label="Trip duration"
                    />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Minimum seats needed
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Any group size"
                        value={people}
                        onChange={(e) => setPeople(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-[#fffdfa] px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(13,95,89,0.12)]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-slate-950 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                  >
                    Search trips
                  </button>
                  <p className="text-sm leading-6 text-slate-500">
                    Real seat counts. No payment taken here. You only pay after the organizer approves your request.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

