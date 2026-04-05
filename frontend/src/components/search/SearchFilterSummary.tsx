"use client";

import { useRouter } from "next/navigation";

interface SearchFilterSummaryProps {
  searchParams: {
    q?: string;
    start_date?: string;
    end_date?: string;
    range_start?: string;
    range_end?: string;
    month?: string;
    min_price?: string;
    max_price?: string;
    min_days?: string;
    max_days?: string;
    people?: string;
  };
}

export function SearchFilterSummary({ searchParams }: SearchFilterSummaryProps) {
  const router = useRouter();
  const activeFilters: Array<{ label: string; value: string }> = [];

  if (searchParams.q) {
    activeFilters.push({ label: "Query", value: searchParams.q });
  }

  if (searchParams.month) {
    const [year, monthNum] = searchParams.month.split("-");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    activeFilters.push({
      label: "Month",
      value: `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`,
    });
  } else if (searchParams.range_start && searchParams.range_end) {
    const start = new Date(searchParams.range_start);
    const end = new Date(searchParams.range_end);
    activeFilters.push({
      label: "Dates",
      value: `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    });
  } else if (searchParams.start_date && searchParams.end_date) {
    const start = new Date(searchParams.start_date);
    const end = new Date(searchParams.end_date);
    activeFilters.push({
      label: "Dates",
      value: `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    });
  }

  if (searchParams.min_price && searchParams.max_price) {
    activeFilters.push({
      label: "Budget",
      value: `INR ${parseInt(searchParams.min_price, 10).toLocaleString()} to INR ${parseInt(
        searchParams.max_price,
        10
      ).toLocaleString()}`,
    });
  }

  if (searchParams.min_days && searchParams.max_days) {
    activeFilters.push({
      label: "Duration",
      value: `${searchParams.min_days}-${searchParams.max_days} days`,
    });
  }

  if (searchParams.people) {
    activeFilters.push({
      label: "Seats",
      value: `${searchParams.people}+`,
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {activeFilters.map((filter) => (
        <div
          key={`${filter.label}-${filter.value}`}
          className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm shadow-slate-950/5"
        >
          <span className="font-medium">{filter.label}:</span> {filter.value}
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          document.getElementById("search-refiner")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
      >
        Edit search
      </button>

      <button
        type="button"
        onClick={() => router.push("/trips/search")}
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
      >
        Clear all
      </button>
    </div>
  );
}
