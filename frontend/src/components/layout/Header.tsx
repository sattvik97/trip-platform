"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HOMEPAGE_CATEGORIES } from "@/src/config/categories";
import { useAuth } from "@/src/contexts/AuthContext";

export function Header() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, role, user, logout } = useAuth();

  const currentCategoryId = pathname?.startsWith("/discover/")
    ? pathname.split("/discover/")[1]?.split("?")[0] || null
    : null;

  const isDiscoverActive =
    pathname === "/discover" ||
    pathname === "/categories" ||
    pathname?.startsWith("/discover/");
  const isSearchActive = pathname === "/trips/search";
  const isWeekendActive = pathname === "/weekend-getaways";

  const closeMenus = () => {
    setCategoriesOpen(false);
    setAccountOpen(false);
    setMobileOpen(false);
  };

  const linkClass = (active: boolean) =>
    `transition-colors ${active ? "text-[var(--accent-strong)]" : "text-slate-700 hover:text-slate-950"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-[#fbf7f0]/90 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0" onClick={closeMenus}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/15">
                TD
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold text-slate-950">
                  TripDiscovery
                </p>
                <p className="hidden text-xs text-slate-500 md:block">
                  Discover trips that already feel worth saying yes to.
                </p>
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/discover" className={linkClass(!!isDiscoverActive)} onClick={closeMenus}>
              Discover
            </Link>
            <Link href="/trips/search" className={linkClass(!!isSearchActive)} onClick={closeMenus}>
              Search
            </Link>
            <Link href="/weekend-getaways" className={linkClass(!!isWeekendActive)} onClick={closeMenus}>
              This Weekend
            </Link>

            <div className="relative">
              <button
                onClick={() => {
                  setCategoriesOpen(!categoriesOpen);
                  setAccountOpen(false);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-1 transition-colors ${
                  currentCategoryId ? "text-[var(--accent-strong)]" : "text-slate-700 hover:text-slate-950"
                }`}
              >
                Categories
                <svg
                  className={`w-4 h-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {categoriesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCategoriesOpen(false)} />
                  <div className="glass-panel absolute left-0 top-full z-20 mt-3 w-64 rounded-3xl border border-white/80 p-2 shadow-2xl shadow-slate-950/10">
                    {HOMEPAGE_CATEGORIES.map((category) => {
                      const isActive = currentCategoryId === category.id;
                      return (
                        <div key={category.id}>
                          {isActive ? (
                            <span className="block rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white">
                              {category.title}
                            </span>
                          ) : (
                            <Link
                              href={`/discover/${category.id}`}
                              className="block rounded-2xl px-4 py-3 text-slate-700 transition-colors hover:bg-white/80"
                              onClick={closeMenus}
                            >
                              {category.title}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                    <div className="my-2 border-t border-slate-200" />
                    <Link
                      href="/categories"
                      className="block rounded-2xl px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-white/80"
                      onClick={closeMenus}
                    >
                      Browse all categories
                    </Link>
                  </div>
                </>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/organizer/register"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
                >
                  Host trips
                </Link>
                <Link
                  href="/auth"
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-950/15 transition-colors hover:bg-slate-800"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => {
                    setAccountOpen(!accountOpen);
                    setCategoriesOpen(false);
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-950 hover:text-slate-950"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#efe4d7] text-xs font-semibold text-slate-900">
                    {(user?.email || "A").charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-40 truncate">{user?.email || "My Account"}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {accountOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                    <div className="glass-panel absolute right-0 top-full z-20 mt-3 w-56 rounded-3xl border border-white/80 p-2 shadow-2xl shadow-slate-950/10">
                      {role === "user" ? (
                        <>
                          <Link
                            href="/account/profile"
                            className="block rounded-2xl px-4 py-3 text-slate-700 transition-colors hover:bg-white/80"
                            onClick={closeMenus}
                          >
                            Profile
                          </Link>
                          <Link
                            href="/account/bookings"
                            className="block rounded-2xl px-4 py-3 text-slate-700 transition-colors hover:bg-white/80"
                            onClick={closeMenus}
                          >
                            My Bookings
                          </Link>
                          <div className="my-2 border-t border-slate-200" />
                          <button
                            onClick={() => {
                              logout();
                              closeMenus();
                              router.push("/");
                            }}
                            className="block w-full rounded-2xl px-4 py-3 text-left text-slate-700 transition-colors hover:bg-white/80"
                          >
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/organizer/dashboard"
                            className="block rounded-2xl px-4 py-3 text-slate-700 transition-colors hover:bg-white/80"
                            onClick={closeMenus}
                          >
                            Organizer Dashboard
                          </Link>
                          <Link
                            href="/admin/payments"
                            className="block rounded-2xl px-4 py-3 text-slate-700 transition-colors hover:bg-white/80"
                            onClick={closeMenus}
                          >
                            Admin Payments
                          </Link>
                          <div className="my-2 border-t border-slate-200" />
                          <button
                            onClick={() => {
                              logout();
                              closeMenus();
                              router.push("/");
                            }}
                            className="block w-full rounded-2xl px-4 py-3 text-left text-slate-700 transition-colors hover:bg-white/80"
                          >
                            Logout
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setCategoriesOpen(false);
              setAccountOpen(false);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-800 shadow-sm md:hidden"
            aria-label="Toggle navigation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"}
              />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="mt-4 rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-950/10 md:hidden">
            <div className="grid gap-2">
              <Link href="/discover" className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]" onClick={closeMenus}>
                Discover trips
              </Link>
              <Link href="/trips/search" className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]" onClick={closeMenus}>
                Search
              </Link>
              <Link href="/weekend-getaways" className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]" onClick={closeMenus}>
                This weekend
              </Link>
              <Link href="/categories" className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]" onClick={closeMenus}>
                Browse categories
              </Link>
              {isAuthenticated ? (
                <>
                  {role === "user" ? (
                    <>
                      <Link href="/account/bookings" className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]" onClick={closeMenus}>
                        My bookings
                      </Link>
                      <Link href="/account/profile" className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]" onClick={closeMenus}>
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/organizer/dashboard"
                        className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]"
                        onClick={closeMenus}
                      >
                        Organizer dashboard
                      </Link>
                      <Link
                        href="/admin/payments"
                        className="rounded-2xl px-4 py-3 text-slate-800 hover:bg-[#f5efe6]"
                        onClick={closeMenus}
                      >
                        Admin payments
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMenus();
                      router.push("/");
                    }}
                    className="rounded-2xl px-4 py-3 text-left text-slate-800 hover:bg-[#f5efe6]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-4">
                  <Link
                    href="/auth"
                    className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-medium text-white"
                    onClick={closeMenus}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/organizer/register"
                    className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-medium text-slate-700"
                    onClick={closeMenus}
                  >
                    Host trips
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
