import { isTripsApiTemporarilyUnavailable, searchTrips } from "@/src/lib/api/trips";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { HeroSearch } from "@/src/components/home/HeroSearch";
import { SearchSummaryHeader } from "@/src/components/search/SearchSummaryHeader";
import { SearchFilterSummary } from "@/src/components/search/SearchFilterSummary";
import { SearchResultsGrid } from "@/src/components/search/SearchResultsGrid";
import { EmptySearchState } from "@/src/components/search/EmptySearchState";

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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;

  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : 20;

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
  const heroSearchKey = JSON.stringify(searchParamsForHeader);

  const trips = await searchTrips({
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
  });
  const backendUnavailable = isTripsApiTemporarilyUnavailable();

  const hasMore = trips.length === validLimit;
  const totalTrips = hasMore
    ? validPage * validLimit + 1
    : (validPage - 1) * validLimit + trips.length;

  const hasActiveFilters = Boolean(
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f5efe6]">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8">
          <HeroSearch
            key={heroSearchKey}
            variant="inline"
            initialValues={searchParamsForHeader}
          />

          <div className="mt-8">
            <SearchSummaryHeader
              searchParams={searchParamsForHeader}
              resultCount={totalTrips}
            />
            <SearchFilterSummary searchParams={searchParamsForHeader} />
          </div>

          {trips.length === 0 ? (
            <EmptySearchState
              hasActiveFilters={hasActiveFilters}
              backendUnavailable={backendUnavailable}
            />
          ) : (
            <SearchResultsGrid
              trips={trips}
              currentPage={validPage}
              hasMore={hasMore}
              totalTrips={totalTrips}
              limit={validLimit}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
