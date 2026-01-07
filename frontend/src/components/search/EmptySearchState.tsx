import Link from "next/link";

interface EmptySearchStateProps {
  hasActiveFilters: boolean;
}

export function EmptySearchState({ hasActiveFilters }: EmptySearchStateProps) {
  return (
    <div className="text-center py-20">
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
          {hasActiveFilters
            ? "We couldn't find trips matching your search"
            : "Start exploring amazing trips"}
        </h3>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {hasActiveFilters ? (
            <>
              Don't worry! Try adjusting your search to discover more options.
              <br />
              You might find great trips by relaxing your dates or expanding your budget.
            </>
          ) : (
            "Use the search bar above to find trips that match your preferences and travel style."
          )}
        </p>

        {/* Suggestions */}
        {hasActiveFilters && (
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
          {hasActiveFilters && (
            <>
              <Link
                href="/trips/search"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear all filters
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start new search
              </Link>
            </>
          )}
          {!hasActiveFilters && (
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse all trips
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

