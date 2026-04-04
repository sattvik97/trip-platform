import { Suspense } from "react";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { BackendUnavailableNotice } from "@/src/components/common/BackendUnavailableNotice";
import { HeroSearch } from "@/src/components/home/HeroSearch";
import { SliderSection } from "@/src/components/home/SliderSection";
import { GridSection } from "@/src/components/home/GridSection";
import {
  HOMEPAGE_CATEGORIES,
  getCategoryViewAllUrl,
  type HomepageCategory,
} from "@/src/config/categories";
import { fetchCategoryTrips } from "@/src/lib/categories";
import { getWeekendGetaways, isTripsApiTemporarilyUnavailable } from "@/src/lib/api/trips";

import type { Trip } from "@/src/types/trip";

export const dynamic = "force-dynamic";

interface CategorySectionProps {
  category: HomepageCategory;
  trips: Trip[];
}

function CategorySection({ category, trips }: CategorySectionProps) {
  const viewAllHref = getCategoryViewAllUrl(category);
  const displayTrips = trips.slice(0, category.displayLimit || 3);

  if (category.sectionType === "slider") {
    return (
      <SliderSection
        title={category.title}
        trips={displayTrips}
        viewAllHref={viewAllHref}
      />
    );
  }

  return (
    <GridSection
      title={category.title}
      trips={displayTrips}
      columns={category.gridColumns || 3}
      viewAllHref={viewAllHref}
    />
  );
}

async function WeekendGetawaysSection() {
  const trips = await getWeekendGetaways();
  
  return (
    <SliderSection
      title="This Weekend"
      trips={trips}
      viewAllHref="/weekend-getaways"
    />
  );
}

async function HomepageSections() {
  // Fetch trips for all categories efficiently (deduplicates API calls)
  const categoryTripsMap = await fetchCategoryTrips(HOMEPAGE_CATEGORIES);
  const backendUnavailable = isTripsApiTemporarilyUnavailable();

  return (
    <div className="py-12">
      {backendUnavailable && (
        <div className="container mx-auto mb-10 max-w-7xl px-4">
          <BackendUnavailableNotice />
        </div>
      )}
      {/* Weekend Getaways - separate section, not mixed with tags */}
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-gray-500">Loading weekend getaways...</p>
          </div>
        }
      >
        <WeekendGetawaysSection />
      </Suspense>
      
      {HOMEPAGE_CATEGORIES.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          trips={categoryTripsMap.get(category.id) || []}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSearch />
        <Suspense
          fallback={
            <div className="text-center py-12">
              <p className="text-gray-500">Loading trips...</p>
            </div>
          }
        >
          <HomepageSections />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
