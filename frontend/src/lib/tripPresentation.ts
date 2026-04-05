import type { Trip } from "@/src/types/trip";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const TAG_LABELS: Record<string, string> = {
  TREK: "Scenic trekking routes",
  BACKPACKING: "Backpacking-style energy",
  STARGAZING: "Night sky moments",
  RELAXING: "Slower, restorative pace",
  ADVENTURE: "High-energy outdoor days",
  SOLO: "Easy to join solo",
  GROUP: "Built for shared memories",
  WOMEN_ONLY: "Women-only community",
  WOMEN_FRIENDLY: "Women-friendly environment",
  BEGINNER_FRIENDLY: "Beginner-friendly plan",
  WEEKEND: "Easy weekend escape",
  MULTI_DAY: "Immersive multi-day trip",
  HIGH_ALTITUDE: "High-altitude experience",
  CULTURAL_EXPERIENCE: "Cultural immersion",
  NATURE_RETREAT: "Nature-first reset",
  PHOTOGRAPHY: "Photography-worthy views",
  INSTAGRAMMABLE: "Visually memorable spots",
  BUDGET: "Budget-conscious pick",
  MID_RANGE: "Balanced comfort and value",
  PREMIUM: "Premium experience",
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPriceInr(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatTripDate(
  dateString: string,
  month: "short" | "long" = "short"
): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month,
    day: "numeric",
    year: "numeric",
  });
}

export function formatTripDateRange(
  startDate: string,
  endDate: string,
  month: "short" | "long" = "short"
): string {
  return `${formatTripDate(startDate, month)} - ${formatTripDate(endDate, month)}`;
}

export function getTripDurationInDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function formatTripDuration(startDate: string, endDate: string): string {
  const days = getTripDurationInDays(startDate, endDate);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function formatSeatCopy(seatsAvailable: number): string {
  return `${seatsAvailable} ${seatsAvailable === 1 ? "seat" : "seats"} left`;
}

export function formatTagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? titleCase(tag);
}

export function deriveTripHighlights(trip: Trip): string[] {
  const highlights = new Set<string>();
  const tags = trip.tags ?? [];

  highlights.add(`${formatTripDuration(trip.start_date, trip.end_date)} curated group journey`);

  if (trip.available_seats <= 3) {
    highlights.add(`Only ${formatSeatCopy(trip.available_seats)} with live seat verification`);
  } else {
    highlights.add(`${formatSeatCopy(trip.available_seats)} verified from approved bookings`);
  }

  if (trip.itinerary && trip.itinerary.length > 0) {
    highlights.add(`${trip.itinerary.length}-day itinerary already mapped out`);
  }

  tags.slice(0, 3).forEach((tag) => {
    highlights.add(formatTagLabel(tag));
  });

  return Array.from(highlights).slice(0, 4);
}

export function deriveTripFitNotes(trip: Trip): string[] {
  const tags = new Set(trip.tags ?? []);
  const notes: string[] = [];

  if (tags.has("SOLO")) {
    notes.push("You want a trip that feels easy to join solo.");
  }
  if (tags.has("BEGINNER_FRIENDLY")) {
    notes.push("You prefer a plan that feels accessible and low-stress.");
  }
  if (tags.has("WEEKEND")) {
    notes.push("You want a high-reward escape without taking a long break.");
  }
  if (tags.has("PREMIUM")) {
    notes.push("You care about comfort, polish, and a more elevated experience.");
  }
  if (tags.has("BUDGET")) {
    notes.push("You want strong value without sacrificing the trip itself.");
  }
  if (tags.has("NATURE_RETREAT") || tags.has("TREK")) {
    notes.push("You recharge best outdoors and want the destination to do some of the work.");
  }

  if (notes.length === 0) {
    notes.push("You want a guided group trip with a clear plan and less coordination overhead.");
  }

  return notes.slice(0, 3);
}
