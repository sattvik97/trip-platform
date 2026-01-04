import Link from "next/link";
import type { Trip } from "@/src/types/trip";

export function TripCard({ trip }: { trip: Trip }) {
  const date = new Date(trip.start_date);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{trip.title}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {trip.available_seats} seats available
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <p className="text-gray-600 flex items-center gap-2">
          <span className="font-medium">Location:</span>
          {trip.destination}
        </p>
        <p className="text-gray-600 flex items-center gap-2">
          <span className="font-medium">Date:</span>
          {formattedDate}
        </p>
      </div>
      <Link
        href={`/trips/${trip.organizer_id}/${trip.slug}`}
        className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
      >
        View Details →
      </Link>
    </div>
  );
}

