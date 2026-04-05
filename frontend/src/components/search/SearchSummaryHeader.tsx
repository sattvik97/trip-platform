interface SearchSummaryHeaderProps {
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

export function SearchSummaryHeader({
  searchParams,
  resultCount,
}: SearchSummaryHeaderProps) {
  const parts: string[] = [];
  const subtextParts: string[] = [];

  if (searchParams.q) {
    parts.push(`Trips for ${searchParams.q}`);
  }

  if (searchParams.max_price) {
    const maxPrice = parseInt(searchParams.max_price, 10);
    parts.push(`Trips under INR ${maxPrice.toLocaleString()}`);
  } else if (searchParams.min_price) {
    const minPrice = parseInt(searchParams.min_price, 10);
    parts.push(`Trips from INR ${minPrice.toLocaleString()}`);
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
    parts.push(`Trips in ${monthNames[parseInt(monthNum, 10) - 1]} ${year}`);
    subtextParts.push("Month-based search");
  } else if (searchParams.range_start || searchParams.range_end) {
    if (searchParams.range_start && searchParams.range_end) {
      const start = new Date(searchParams.range_start);
      const end = new Date(searchParams.range_end);
      parts.push(
        `Trips from ${start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} to ${end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
      );
    }
    subtextParts.push("Flexible dates");
  } else if (searchParams.start_date || searchParams.end_date) {
    if (searchParams.start_date && searchParams.end_date) {
      const start = new Date(searchParams.start_date);
      const end = new Date(searchParams.end_date);
      parts.push(
        `Trips from ${start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} to ${end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
      );
    }
    subtextParts.push("Exact dates");
  }

  if (searchParams.min_days && searchParams.max_days) {
    subtextParts.push(`${searchParams.min_days}-${searchParams.max_days} days`);
  } else if (searchParams.min_days) {
    subtextParts.push(`Min ${searchParams.min_days} days`);
  } else if (searchParams.max_days) {
    subtextParts.push(`Max ${searchParams.max_days} days`);
  }

  if (searchParams.people) {
    subtextParts.push(`Needs ${searchParams.people} ${searchParams.people === "1" ? "seat" : "seats"}`);
  }

  if (searchParams.min_price && searchParams.max_price) {
    const minPrice = parseInt(searchParams.min_price, 10);
    const maxPrice = parseInt(searchParams.max_price, 10);
    subtextParts.push(`INR ${minPrice.toLocaleString()} to INR ${maxPrice.toLocaleString()}`);
  }

  const title = parts.length > 0 ? parts.join(" • ") : "All upcoming trips";
  const subtext =
    subtextParts.length > 0
      ? subtextParts.join(" • ")
      : "Live seat counts reflect approved payment holds and confirmed bookings.";

  return (
    <div className="mb-6 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-lg shadow-slate-950/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Search results
          </p>
          <h1 className="font-display text-4xl font-semibold text-slate-950 md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">{subtext}</p>
        </div>
        <div className="rounded-full border border-slate-300 bg-[#f7f1e8] px-4 py-2 text-sm font-medium text-slate-700">
          {resultCount} {resultCount === 1 ? "trip" : "trips"} found
        </div>
      </div>
    </div>
  );
}
