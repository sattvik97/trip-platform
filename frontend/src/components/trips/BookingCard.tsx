interface BookingCardProps {
  price: number;
  dateRange: string;
  duration: string;
  groupSize: string;
  seatsAvailable: number;
}

export function BookingCard({
  price,
  dateRange,
  duration,
  groupSize,
  seatsAvailable,
}: BookingCardProps) {
  const isAvailable = seatsAvailable > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 sticky top-24">
      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            ₹{price.toLocaleString()}
          </span>
          <span className="text-gray-500 text-sm">per person</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Dates</p>
            <p className="text-sm text-gray-600">{dateRange}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Duration</p>
            <p className="text-sm text-gray-600">{duration}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Group Size</p>
            <p className="text-sm text-gray-600">{groupSize}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Seats Available</p>
            <p className="text-sm text-gray-600">
              {seatsAvailable} {seatsAvailable === 1 ? "seat" : "seats"} left
            </p>
          </div>
        </div>
      </div>

      {/* Book Now Button */}
      <button
        type="button"
        disabled={!isAvailable}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
          isAvailable
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isAvailable ? "Book Now" : "Fully Booked"}
      </button>

      {isAvailable && (
        <p className="text-center text-sm text-gray-500 mt-4">
          You won't be charged yet
        </p>
      )}
    </div>
  );
}

