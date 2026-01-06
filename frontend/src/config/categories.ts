import type { Trip } from "@/src/types/trip";
import { GetTripsParams } from "@/src/lib/api/trips";

export type SectionType = "slider" | "grid";

export interface HomepageCategory {
  id: string;
  title: string;
  description?: string; // Short description for category pages
  sectionType: SectionType;
  // Filter configuration for fetching trips
  filter: GetTripsParams;
  // Number of trips to display on homepage (default: 3 for slider, 6 for grid)
  displayLimit?: number;
  // Grid columns (only for grid type)
  gridColumns?: 3 | 4;
}

/**
 * Homepage categories configuration
 * Add new categories here - they will automatically appear on the homepage
 */
export const HOMEPAGE_CATEGORIES: HomepageCategory[] = [
  {
    id: "upcoming",
    title: "Upcoming Trips",
    description: "Handpicked trips starting soon that you can join",
    sectionType: "slider",
    filter: {
      page: 1,
      limit: 20,
      // No tags = all trips
    },
    displayLimit: 5,
  },
  {
    id: "trekking",
    title: "Trekking Adventures",
    description: "Explore mountains, trails, and nature on foot",
    sectionType: "grid",
    filter: {
      page: 1,
      limit: 20,
      tags: ["TREK"],
    },
    displayLimit: 6,
    gridColumns: 3,
  },
  {
    id: "stargazing",
    title: "Stargazing & Experiences",
    description: "Unforgettable nights under the stars",
    sectionType: "slider",
    filter: {
      page: 1,
      limit: 20,
      tags: ["STARGAZING"],
    },
    displayLimit: 5,
  },
  {
    id: "solo",
    title: "Solo Travel Friendly",
    description: "Perfect trips for independent travelers",
    sectionType: "grid",
    filter: {
      page: 1,
      limit: 20,
      tags: ["SOLO"],
    },
    displayLimit: 6,
    gridColumns: 3,
  },
  // Add more categories here as needed
  // Example:
  // {
  //   id: "adventure",
  //   title: "Adventure Trips",
  //   sectionType: "slider",
  //   filter: {
  //     page: 1,
  //     limit: 20,
  //     tags: ["ADVENTURE"],
  //   },
  //   displayLimit: 5,
  // },
];

/**
 * Build the "View All" URL for a category
 * Uses the new /discover/[category] route format
 */
export function getCategoryViewAllUrl(category: HomepageCategory): string {
  return `/discover/${category.id}`;
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): HomepageCategory | undefined {
  return HOMEPAGE_CATEGORIES.find((cat) => cat.id === id);
}

