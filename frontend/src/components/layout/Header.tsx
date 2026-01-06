"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { HOMEPAGE_CATEGORIES } from "@/src/config/categories";

export function Header() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  
  // Extract current category from pathname (e.g., /discover/trekking -> trekking)
  const currentCategoryId = pathname?.startsWith("/discover/")
    ? pathname.split("/discover/")[1]?.split("?")[0] || null
    : null;

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          {/* Brand */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            TripDiscovery
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setCategoriesOpen(!categoriesOpen);
                  setAccountOpen(false);
                }}
                className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                Categories
                <svg
                  className={`w-4 h-4 transition-transform ${
                    categoriesOpen ? "rotate-180" : ""
                  }`}
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
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setCategoriesOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    {HOMEPAGE_CATEGORIES.map((category) => {
                      const isActive = currentCategoryId === category.id;
                      return (
                        <div key={category.id}>
                          {isActive ? (
                            <span className="block px-4 py-2 text-blue-600 bg-blue-50 font-medium cursor-default">
                              {category.title}
                            </span>
                          ) : (
                            <Link
                              href={`/discover/${category.id}`}
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setCategoriesOpen(false)}
                            >
                              {category.title}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-200 my-1" />
                    <Link
                      href="/discover"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      View All Categories
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Contact Us */}
            <Link
              href="/contact"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Contact Us
            </Link>

            {/* My Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setAccountOpen(!accountOpen);
                  setCategoriesOpen(false);
                }}
                className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                My Account
                <svg
                  className={`w-4 h-4 transition-transform ${
                    accountOpen ? "rotate-180" : ""
                  }`}
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
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <Link
                      href="/organizer/login"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Login as User
                    </Link>
                    <Link
                      href="/organizer/login"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Login as Organizer
                    </Link>
                    <div className="border-t border-gray-200 my-1" />
                    <Link
                      href="/organizer/register"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
