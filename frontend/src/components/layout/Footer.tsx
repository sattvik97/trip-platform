import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[color:var(--line)] bg-[#f7f1e8]">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-display text-3xl font-semibold text-slate-950">
              TripDiscovery
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              A discovery-led trip platform built around real availability, organizer-led groups,
              and a calmer way to choose where your next memory starts.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full border border-slate-300 px-3 py-1.5">
                Live seat accuracy
              </span>
              <span className="rounded-full border border-slate-300 px-3 py-1.5">
                Organizer-led trips
              </span>
              <span className="rounded-full border border-slate-300 px-3 py-1.5">
                Approval-based group fit
              </span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">Explore</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                <Link href="/discover" className="transition-colors hover:text-slate-950">
                  Discover trips
                </Link>
                <Link href="/trips/search" className="transition-colors hover:text-slate-950">
                  Search all trips
                </Link>
                <Link href="/weekend-getaways" className="transition-colors hover:text-slate-950">
                  This weekend
                </Link>
                <Link href="/categories" className="transition-colors hover:text-slate-950">
                  Browse categories
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-950">For Organizers</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                <Link href="/organizer/register" className="transition-colors hover:text-slate-950">
                  Become an organizer
                </Link>
                <Link href="/organizer/login" className="transition-colors hover:text-slate-950">
                  Organizer login
                </Link>
                <Link href="/auth" className="transition-colors hover:text-slate-950">
                  Traveler sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">
          TripDiscovery © 2026
        </div>
      </div>
    </footer>
  );
}

