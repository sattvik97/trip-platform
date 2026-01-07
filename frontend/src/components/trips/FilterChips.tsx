"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface FilterChip {
  key: string;
  label: string;
  value: string;
  relatedKeys?: string[]; // Keys to remove together (e.g., start_date + end_date)
}

export function FilterChips() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: FilterChip[] = [];

  // Build filter chips from search params
  const q = searchParams.get("q");
  if (q) {
    filters.push({ key: "q", label: "Search", value: q });
  }

  // Date filters - handle different modes
  const month = searchParams.get("month");
  if (month) {
    const [year, monthNum] = month.split("-");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    filters.push({
      key: "month",
      label: "Month",
      value: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
    });
  } else {
    const rangeStart = searchParams.get("range_start");
    const rangeEnd = searchParams.get("range_end");
    if (rangeStart || rangeEnd) {
      const value = rangeStart && rangeEnd
        ? `${new Date(rangeStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(rangeEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : rangeStart
        ? `From ${new Date(rangeStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : `Until ${new Date(rangeEnd!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      filters.push({
        key: "range_start",
        label: "Date Range",
        value,
        relatedKeys: ["range_start", "range_end"],
      });
    } else {
      const startDate = searchParams.get("start_date");
      const endDate = searchParams.get("end_date");
      if (startDate) {
        filters.push({
          key: "start_date",
          label: "Start Date",
          value: new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          relatedKeys: startDate && endDate ? ["start_date", "end_date"] : undefined,
        });
      }
      if (endDate && !startDate) {
        filters.push({
          key: "end_date",
          label: "End Date",
          value: new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        });
      }
    }
  }

  // Price filters
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  if (minPrice && maxPrice) {
    filters.push({
      key: "min_price",
      label: "Budget",
      value: `₹${parseInt(minPrice).toLocaleString()} - ₹${parseInt(maxPrice).toLocaleString()}`,
      relatedKeys: ["min_price", "max_price"],
    });
  } else if (minPrice) {
    filters.push({ key: "min_price", label: "Min Price", value: `₹${parseInt(minPrice).toLocaleString()}` });
  } else if (maxPrice) {
    filters.push({ key: "max_price", label: "Max Price", value: `₹${parseInt(maxPrice).toLocaleString()}` });
  }

  // Duration filters
  const minDays = searchParams.get("min_days");
  const maxDays = searchParams.get("max_days");
  if (minDays && maxDays) {
    filters.push({
      key: "min_days",
      label: "Duration",
      value: `${minDays} - ${maxDays} days`,
      relatedKeys: ["min_days", "max_days"],
    });
  } else if (minDays) {
    filters.push({ key: "min_days", label: "Min Duration", value: `${minDays} days` });
  } else if (maxDays) {
    filters.push({ key: "max_days", label: "Max Duration", value: `${maxDays} days` });
  }

  // People filter
  const people = searchParams.get("people");
  if (people) {
    filters.push({ key: "people", label: "People", value: `${people} ${people === "1" ? "person" : "people"}` });
  }

  if (filters.length === 0) {
    return null;
  }

  const removeFilter = (filter: FilterChip) => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove related keys if they exist
    const keysToRemove = filter.relatedKeys || [filter.key];
    keysToRemove.forEach((key) => params.delete(key));
    // Reset to page 1 when removing filters
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filters:</span>
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => removeFilter(filter)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            <span>
              {filter.label}: {filter.value}
            </span>
            <svg
              className="w-4 h-4"
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
        ))}
        {filters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

