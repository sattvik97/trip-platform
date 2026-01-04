import Link from "next/link";

interface PaginationControlsProps {
  currentPage: number;
  hasMore: boolean;
  basePath?: string;
}

export function PaginationControls({
  currentPage,
  hasMore,
  basePath = "/trips",
}: PaginationControlsProps) {
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = hasMore ? currentPage + 1 : null;

  return (
    <div className="flex justify-center items-center gap-4 mt-8">
      {prevPage ? (
        <Link
          href={`${basePath}?page=${prevPage}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Previous
        </Link>
      ) : (
        <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">
          Previous
        </span>
      )}

      <span className="text-gray-600">Page {currentPage}</span>

      {nextPage ? (
        <Link
          href={`${basePath}?page=${nextPage}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Next
        </Link>
      ) : (
        <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">
          Next
        </span>
      )}
    </div>
  );
}

