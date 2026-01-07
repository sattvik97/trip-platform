interface TripDetailHeroProps {
  title: string;
  location: string;
  dateRange: string;
  seatsAvailable: number;
  tags?: string[] | null;
}

export function TripDetailHero({
  title,
  location,
  dateRange,
  seatsAvailable,
  tags,
}: TripDetailHeroProps) {
  return (
    <div className="relative h-[500px] md:h-[600px] w-full">
      {/* Background Image / Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Overlay Content */}
      <div className="relative h-full flex items-end">
        <div className="container mx-auto px-4 pb-16 max-w-7xl">
          <div className="max-w-3xl">
            {/* Seats Badge */}
            {seatsAvailable > 0 && (
              <div className="inline-block mb-5">
                <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-gray-900">
                  {seatsAvailable} seats left
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              {title}
            </h1>

            {/* Location and Date - More Prominent */}
            <div className="flex flex-wrap items-center gap-6 mb-5 text-white">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg">
                <svg
                  className="w-6 h-6 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-lg font-semibold">{location}</span>
              </div>

              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg">
                <svg
                  className="w-6 h-6 flex-shrink-0"
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
                <span className="text-lg font-semibold">{dateRange}</span>
              </div>
            </div>

            {/* Tags - Read-only informational chips */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-white border border-white/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



