import Link from "next/link";

interface EmptySearchStateProps {
  hasActiveFilters: boolean;
  backendUnavailable?: boolean;
}

export function EmptySearchState({
  hasActiveFilters,
  backendUnavailable = false,
}: EmptySearchStateProps) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/85 py-20 text-center shadow-lg shadow-slate-950/5">
      <div className="max-w-lg mx-auto">
        {/* Icon */}
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
          {backendUnavailable
            ? "We could not reach the trip service"
            : hasActiveFilters
            ? "We couldn't find trips matching your search"
            : "Start exploring amazing trips"}
        </h3>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {backendUnavailable ? (
            <>
              The frontend is running, but the backend trip API is not reachable right now.
              <br />
              If you are working locally, start the FastAPI server on port 8000 or set <code>NEXT_PUBLIC_API_BASE_URL</code>.
            </>
          ) : hasActiveFilters ? (
            <>
              Do not worry. Try adjusting your search to discover more options.
              <br />
              You might find great trips by relaxing your dates or expanding your budget.
            </>
          ) : (
            "Use the search bar above to find trips that match your preferences and travel style."
          )}
        </p>

        {/* Suggestions */}
        {hasActiveFilters && !backendUnavailable && (
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Suggestions:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Try flexible dates instead of exact dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Increase your budget range to see more options</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Remove some filters to broaden your search</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasActiveFilters && !backendUnavailable && (
            <>
              <Link
                href="/trips/search"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800"
              >
                Clear all filters
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
              >
                Explore collections
              </Link>
            </>
          )}
          {!hasActiveFilters && (
            <Link
              href="/discover"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800"
            >
              {backendUnavailable ? "Open collections" : "Browse all trips"}
            </Link>
          )}
          {backendUnavailable && hasActiveFilters && (
            <Link
              href="/discover"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800"
            >
              Explore collections
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

