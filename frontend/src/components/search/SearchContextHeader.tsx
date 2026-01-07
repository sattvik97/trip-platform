interface SearchContextHeaderProps {
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
  resultCount: number;
}

export function SearchContextHeader({
  searchParams,
  resultCount,
}: SearchContextHeaderProps) {
  const parts: string[] = [];
  const subtextParts: string[] = [];

  // Destination
  if (searchParams.q) {
    parts.push(`Trips near ${searchParams.q}`);
  }

  // Budget
  if (searchParams.max_price) {
    const maxPrice = parseInt(searchParams.max_price);
    if (maxPrice < 1000) {
      parts.push(`Trips under ₹${maxPrice}`);
    } else if (maxPrice < 100000) {
      parts.push(`Trips under ₹${(maxPrice / 1000).toFixed(0)}k`);
    } else {
      parts.push(`Trips under ₹${(maxPrice / 100000).toFixed(1)}L`);
    }
  } else if (searchParams.min_price) {
    const minPrice = parseInt(searchParams.min_price);
    if (minPrice < 1000) {
      parts.push(`Trips from ₹${minPrice}`);
    } else if (minPrice < 100000) {
      parts.push(`Trips from ₹${(minPrice / 1000).toFixed(0)}k`);
    } else {
      parts.push(`Trips from ₹${(minPrice / 100000).toFixed(1)}L`);
    }
  }

  // Date mode
  if (searchParams.month) {
    const [year, monthNum] = searchParams.month.split("-");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    parts.push(`Trips in ${monthNames[parseInt(monthNum) - 1]} ${year}`);
    subtextParts.push("Month-based search");
  } else if (searchParams.range_start || searchParams.range_end) {
    if (searchParams.range_start && searchParams.range_end) {
      const start = new Date(searchParams.range_start);
      const end = new Date(searchParams.range_end);
      parts.push(
        `Trips from ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      );
    } else if (searchParams.range_start) {
      const start = new Date(searchParams.range_start);
      parts.push(`Trips from ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
    } else if (searchParams.range_end) {
      const end = new Date(searchParams.range_end);
      parts.push(`Trips until ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
    }
    subtextParts.push("Flexible date range");
  } else if (searchParams.start_date || searchParams.end_date) {
    if (searchParams.start_date && searchParams.end_date) {
      const start = new Date(searchParams.start_date);
      const end = new Date(searchParams.end_date);
      parts.push(
        `Trips from ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      );
    } else if (searchParams.start_date) {
      const start = new Date(searchParams.start_date);
      parts.push(`Trips from ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
    } else if (searchParams.end_date) {
      const end = new Date(searchParams.end_date);
      parts.push(`Trips until ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
    }
    subtextParts.push("Exact dates");
  }

  // Duration
  if (searchParams.min_days && searchParams.max_days) {
    subtextParts.push(`${searchParams.min_days}-${searchParams.max_days} days`);
  } else if (searchParams.min_days) {
    subtextParts.push(`Min ${searchParams.min_days} days`);
  } else if (searchParams.max_days) {
    subtextParts.push(`Max ${searchParams.max_days} days`);
  }

  // People
  if (searchParams.people) {
    subtextParts.push(`${searchParams.people} ${searchParams.people === "1" ? "person" : "people"}`);
  }

  // Budget range in subtext
  if (searchParams.min_price && searchParams.max_price) {
    const minPrice = parseInt(searchParams.min_price);
    const maxPrice = parseInt(searchParams.max_price);
    subtextParts.push(`₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`);
  }

  // Default title if no filters
  const title = parts.length > 0 ? parts.join(" • ") : "All Trips";
  const subtext = subtextParts.length > 0 ? subtextParts.join(" • ") : null;

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {subtext && (
            <p className="text-gray-600 text-sm md:text-base">{subtext}</p>
          )}
        </div>
        <div className="text-sm text-gray-600 font-medium" data-result-count>
          {resultCount > 0 ? `${resultCount} ${resultCount === 1 ? "trip" : "trips"} found` : "Loading..."}
        </div>
      </div>
    </div>
  );
}

