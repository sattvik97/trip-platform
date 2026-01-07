"use client";

import { useRouter } from "next/navigation";

interface FilterSummaryBarProps {
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

export function FilterSummaryBar({ searchParams }: FilterSummaryBarProps) {
  const router = useRouter();
  const activeFilters: Array<{ label: string; value: string }> = [];

  // Dates
  if (searchParams.month) {
    const [year, monthNum] = searchParams.month.split("-");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    activeFilters.push({
      label: "Month",
      value: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
    });
  } else if (searchParams.range_start || searchParams.range_end) {
    if (searchParams.range_start && searchParams.range_end) {
      const start = new Date(searchParams.range_start);
      const end = new Date(searchParams.range_end);
      activeFilters.push({
        label: "Dates",
        value: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      });
    }
  } else if (searchParams.start_date || searchParams.end_date) {
    if (searchParams.start_date && searchParams.end_date) {
      const start = new Date(searchParams.start_date);
      const end = new Date(searchParams.end_date);
      activeFilters.push({
        label: "Dates",
        value: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      });
    }
  }

  // Budget
  if (searchParams.min_price && searchParams.max_price) {
    const minPrice = parseInt(searchParams.min_price);
    const maxPrice = parseInt(searchParams.max_price);
    activeFilters.push({
      label: "Budget",
      value: `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`,
    });
  } else if (searchParams.max_price) {
    activeFilters.push({
      label: "Budget",
      value: `Up to ₹${parseInt(searchParams.max_price).toLocaleString()}`,
    });
  } else if (searchParams.min_price) {
    activeFilters.push({
      label: "Budget",
      value: `From ₹${parseInt(searchParams.min_price).toLocaleString()}`,
    });
  }

  // Duration
  if (searchParams.min_days && searchParams.max_days) {
    activeFilters.push({
      label: "Duration",
      value: `${searchParams.min_days}-${searchParams.max_days} days`,
    });
  } else if (searchParams.min_days) {
    activeFilters.push({
      label: "Duration",
      value: `Min ${searchParams.min_days} days`,
    });
  } else if (searchParams.max_days) {
    activeFilters.push({
      label: "Duration",
      value: `Max ${searchParams.max_days} days`,
    });
  }

  // People
  if (searchParams.people) {
    activeFilters.push({
      label: "People",
      value: `${searchParams.people} ${searchParams.people === "1" ? "person" : "people"}`,
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  const handleRefineSearch = () => {
    // Scroll to top and show search UI (could be enhanced with a modal or drawer)
    window.scrollTo({ top: 0, behavior: "smooth" });
    // In a real implementation, you might want to open a search modal or navigate to search page
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6 -mx-4 px-4 md:-mx-8 md:px-8">
      <div className="container mx-auto max-w-7xl py-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                <span className="font-medium">{filter.label}:</span>
                <span>{filter.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleRefineSearch}
            className="ml-auto px-4 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Refine Search
          </button>
        </div>
      </div>
    </div>
  );
}

