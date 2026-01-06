import { getTrips } from "@/src/lib/api/trips";
import type { HomepageCategory } from "@/src/config/categories";
import type { Trip } from "@/src/types/trip";
import type { GetTripsParams } from "@/src/lib/api/trips";

/**
 * Create a cache key from filter params to deduplicate API calls
 */
function getFilterCacheKey(filter: GetTripsParams): string {
  const key = {
    page: filter.page || 1,
    limit: filter.limit || 20,
    tags: filter.tags?.sort().join(",") || "",
    destination: filter.destination || "",
    min_price: filter.min_price || "",
    max_price: filter.max_price || "",
    start_date: filter.start_date || "",
  };
  return JSON.stringify(key);
}

/**
 * Fetch trips for multiple categories efficiently
 * Deduplicates API calls if multiple categories share the same filter
 */
export async function fetchCategoryTrips(
  categories: HomepageCategory[]
): Promise<Map<string, Trip[]>> {
  // Group categories by their filter (to avoid duplicate API calls)
  const filterMap = new Map<string, { filter: GetTripsParams; categoryIds: string[] }>();

  categories.forEach((category) => {
    const cacheKey = getFilterCacheKey(category.filter);
    const existing = filterMap.get(cacheKey);

    if (existing) {
      // Multiple categories share the same filter - group them
      existing.categoryIds.push(category.id);
    } else {
      // New unique filter
      filterMap.set(cacheKey, {
        filter: category.filter,
        categoryIds: [category.id],
      });
    }
  });

  // Fetch trips for each unique filter (deduplicated)
  const uniqueFilters = Array.from(filterMap.values());
  const tripPromises = uniqueFilters.map(({ filter }) => getTrips(filter));
  const tripResults = await Promise.all(tripPromises);

  // Map results back to categories
  const resultMap = new Map<string, Trip[]>();
  
  uniqueFilters.forEach(({ categoryIds }, index) => {
    const trips = tripResults[index];
    // Share the same trips result for all categories with this filter
    categoryIds.forEach((categoryId) => {
      resultMap.set(categoryId, trips);
    });
  });

  return resultMap;
}

