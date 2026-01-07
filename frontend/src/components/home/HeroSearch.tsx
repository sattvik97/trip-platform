"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { RangeSlider } from "@/src/components/search/RangeSlider";
import { FlexibleDatePicker } from "@/src/components/search/FlexibleDatePicker";

type DateMode = "exact" | "flexible" | "month";

export function HeroSearch() {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Primary search
  const [searchQuery, setSearchQuery] = useState("");
  
  // Date filters
  const [dateMode, setDateMode] = useState<DateMode>("exact");
  const [exactStartDate, setExactStartDate] = useState("");
  const [exactEndDate, setExactEndDate] = useState("");
  const [flexibleStartDate, setFlexibleStartDate] = useState("");
  const [flexibleEndDate, setFlexibleEndDate] = useState("");
  const [month, setMonth] = useState("");
  
  // Budget slider (default: 0 to 100000)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000]);
  
  // Duration slider (default: 1 to 30 days)
  const [durationRange, setDurationRange] = useState<[number, number]>([1, 30]);
  
  // People filter
  const [people, setPeople] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    
    // Search query
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    
    // Date filters (mutually exclusive)
    if (dateMode === "month" && month) {
      params.set("month", month);
    } else if (dateMode === "flexible") {
      if (flexibleStartDate) params.set("range_start", flexibleStartDate);
      if (flexibleEndDate) params.set("range_end", flexibleEndDate);
    } else if (dateMode === "exact") {
      if (exactStartDate) params.set("start_date", exactStartDate);
      if (exactEndDate) params.set("end_date", exactEndDate);
    }
    
    // Budget filters
    if (budgetRange[0] > 0) {
      params.set("min_price", budgetRange[0].toString());
    }
    if (budgetRange[1] < 100000) {
      params.set("max_price", budgetRange[1].toString());
    }
    
    // Duration filters
    if (durationRange[0] > 1) {
      params.set("min_days", durationRange[0].toString());
    }
    if (durationRange[1] < 30) {
      params.set("max_days", durationRange[1].toString());
    }
    
    // People filter (only if set)
    if (people) {
      params.set("people", people);
    }
    
    // Redirect to search page with query params
    const queryString = params.toString();
    router.push(`/trips/search${queryString ? `?${queryString}` : ""}`);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}k`;
    }
    return `₹${value}`;
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Headline */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Find your next adventure
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            Discover curated trips, experiences, and group journeys
          </p>
        </div>

        {/* Search Bar UI */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 lg:p-8">
            {/* Primary Search - Always Visible */}
            <div className="space-y-4">
              {/* Where to? - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where to? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Anywhere - location or trip name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Advanced Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>{showAdvanced ? "Hide" : "Show"} advanced filters</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
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

              {/* Advanced Filters */}
              {showAdvanced && (
                <div className="space-y-6 pt-4 border-t border-gray-200">
                  {/* Flexible Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      When?
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

                  {/* Budget Slider */}
                  <div>
                    <RangeSlider
                      min={0}
                      max={100000}
                      step={1000}
                      value={budgetRange}
                      onChange={setBudgetRange}
                      formatLabel={formatPrice}
                      label="Budget"
                    />
                  </div>

                  {/* Duration Slider */}
                  <div>
                    <RangeSlider
                      min={1}
                      max={30}
                      step={1}
                      value={durationRange}
                      onChange={setDurationRange}
                      formatLabel={(v) => `${v} ${v === 1 ? "day" : "days"}`}
                      label="Trip Duration"
                    />
                  </div>

                  {/* People Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of People <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Any"
                      value={people}
                      onChange={(e) => setPeople(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Search Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                  Search Trips
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

