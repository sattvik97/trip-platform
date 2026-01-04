import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          {/* Brand */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            TripDiscovery
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex gap-8">
            <Link
              href="/trips"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Upcoming Trips
            </Link>
            <Link
              href="/trips"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Treks
            </Link>
            <Link
              href="/trips"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Stargazing
            </Link>
            <Link
              href="/trips"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Solo Travel
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

