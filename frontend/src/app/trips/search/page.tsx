import { Suspense } from "react";
import type { Trip } from "@/src/types/trip";
import { searchTrips } from "@/src/lib/api/trips";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { SearchContextHeader } from "@/src/components/search/SearchContextHeader";
import { FilterSummaryBar } from "@/src/components/search/FilterSummaryBar";
import { FilterChips } from "@/src/components/trips/FilterChips";
import { SearchResultsGrid } from "@/src/components/search/SearchResultsGrid";
import { EmptySearchState } from "@/src/components/search/EmptySearchState";
import { ResultCountProvider } from "./ResultCountProvider";

async function SearchResultsContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    start_date?: string;
    end_date?: string;
    range_start?: string;
    range_end?: string;
    month?: string;
    people?: string;
    min_price?: string;
    max_price?: string;
    min_days?: string;
    max_days?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;

  // Validate pagination params
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;

  // Build search params
  const searchParams_obj = {
    page: validPage,
    limit: validLimit,
    q: params.q,
    start_date: params.start_date,
    end_date: params.end_date,
    range_start: params.range_start,
    range_end: params.range_end,
    month: params.month,
    people: params.people ? parseInt(params.people, 10) : undefined,
    min_price: params.min_price ? parseInt(params.min_price, 10) : undefined,
    max_price: params.max_price ? parseInt(params.max_price, 10) : undefined,
    min_days: params.min_days ? parseInt(params.min_days, 10) : undefined,
    max_days: params.max_days ? parseInt(params.max_days, 10) : undefined,
  };

  const trips = await searchTrips(searchParams_obj);

  const hasMore = trips.length === validLimit;
  const totalTrips = hasMore
    ? validPage * validLimit + 1
    : (validPage - 1) * validLimit + trips.length;

  const hasActiveFilters = !!(
    params.q ||
    params.start_date ||
    params.end_date ||
    params.range_start ||
    params.range_end ||
    params.month ||
    params.people ||
    params.min_price ||
    params.max_price ||
    params.min_days ||
    params.max_days
  );

  if (trips.length === 0) {
    return <EmptySearchState hasActiveFilters={hasActiveFilters} />;
  }

  return (
    <SearchResultsGrid
      trips={trips}
      currentPage={validPage}
      hasMore={hasMore}
      totalTrips={totalTrips}
      limit={validLimit}
    />
  );
}

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    start_date?: string;
    end_date?: string;
    range_start?: string;
    range_end?: string;
    month?: string;
    people?: string;
    min_price?: string;
    max_price?: string;
    min_days?: string;
    max_days?: string;
    page?: string;
    limit?: string;
  }>;
}

async function SearchResultsWithCount({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    start_date?: string;
    end_date?: string;
    range_start?: string;
    range_end?: string;
    month?: string;
    people?: string;
    min_price?: string;
    max_price?: string;
    min_days?: string;
    max_days?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;

  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;

  const searchParams_obj = {
    page: validPage,
    limit: validLimit,
    q: params.q,
    start_date: params.start_date,
    end_date: params.end_date,
    range_start: params.range_start,
    range_end: params.range_end,
    month: params.month,
    people: params.people ? parseInt(params.people, 10) : undefined,
    min_price: params.min_price ? parseInt(params.min_price, 10) : undefined,
    max_price: params.max_price ? parseInt(params.max_price, 10) : undefined,
    min_days: params.min_days ? parseInt(params.min_days, 10) : undefined,
    max_days: params.max_days ? parseInt(params.max_days, 10) : undefined,
  };

  const trips = await searchTrips(searchParams_obj);
  const hasMore = trips.length === validLimit;
  const totalTrips = hasMore
    ? validPage * validLimit + 1
    : (validPage - 1) * validLimit + trips.length;

  return (
    <ResultCountProvider count={totalTrips}>
      <SearchResultsContent searchParams={Promise.resolve(params)} />
    </ResultCountProvider>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  // Calculate result count (we'll get this from the actual results)
  // For now, we'll pass the params to the header
  const searchParamsForHeader = {
    q: params.q,
    start_date: params.start_date,
    end_date: params.end_date,
    range_start: params.range_start,
    range_end: params.range_end,
    month: params.month,
    people: params.people,
    min_price: params.min_price,
    max_price: params.max_price,
    min_days: params.min_days,
    max_days: params.max_days,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8">
          {/* Search Context Header - Show with results */}
          <SearchContextHeader
            searchParams={searchParamsForHeader}
            resultCount={0} // Will be updated by results
          />

          {/* Filter Summary Bar (Sticky) */}
          <Suspense
            fallback={
              <div className="mb-6">
                <div className="h-12 bg-gray-200 rounded animate-pulse" />
              </div>
            }
          >
            <FilterSummaryBar searchParams={searchParamsForHeader} />
          </Suspense>

          {/* Secondary Filter Chips */}
          <Suspense
            fallback={
              <div className="mb-6">
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            }
          >
            <FilterChips />
          </Suspense>

          {/* Search Results with Sorting */}
          <Suspense
            fallback={
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Loading trips...</p>
              </div>
            }
          >
            <SearchResultsWithCount searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
