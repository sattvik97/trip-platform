"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function PaginationControls({
  currentPage,
  hasMore,
  totalTrips,
  limit,
  basePath,
}: {
  currentPage: number;
  hasMore: boolean;
  totalTrips: number;
  limit: number;
  basePath?: string; // Optional base path, defaults to current pathname
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const base = basePath || pathname;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = hasMore ? currentPage + 1 : null;

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${base}?${params.toString()}`);
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalTrips);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-8 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing {startItem}–{endItem} of {totalTrips} trips
      </div>
      <div className="flex justify-center items-center gap-4">
        {prevPage ? (
          <button
            onClick={() => updatePage(prevPage)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Previous
          </button>
        ) : (
          <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">
            Previous
          </span>
        )}

        <span className="text-gray-600">Page {currentPage}</span>

        {nextPage ? (
          <button
            onClick={() => updatePage(nextPage)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Next
          </button>
        ) : (
          <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
