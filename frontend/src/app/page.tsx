import { Suspense } from "react";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { HeroSearch } from "@/src/components/home/HeroSearch";
import { SliderSection } from "@/src/components/home/SliderSection";
import { GridSection } from "@/src/components/home/GridSection";
import { getTrips } from "@/src/lib/api/trips";

async function HomepageSections() {
  // Fetch trips for all sections (same data for now, can be filtered later)
  const trips = await getTrips({ page: 1, limit: 20 });

  return (
    <div className="py-12">
      <SliderSection title="Upcoming Trips" trips={trips} />
      <GridSection title="Trekking Adventures" trips={trips} />
      <SliderSection title="Stargazing & Experiences" trips={trips} />
      <GridSection title="Solo Travel Friendly" trips={trips} />
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
