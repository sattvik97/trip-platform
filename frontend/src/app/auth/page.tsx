"use client";

import Link from "next/link";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";

export default function AuthIntentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to TripDiscovery
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your platform for discovering amazing group trips or hosting your own adventures
            </p>
          </div>

          {/* Intent Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Traveler Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
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
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Join trips as a Traveler
                </h2>
                <p className="text-gray-600">
                  Discover curated group trips, request to join, and track your bookings.
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full text-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Continue as Traveler
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center py-2 px-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  New here? Register
                </Link>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Host trips as an Organizer
                </h2>
                <p className="text-gray-600">
                  Create trips, manage booking requests, and track seat availability.
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  href="/organizer/login"
                  className="block w-full text-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Continue as Organizer
                </Link>
                <Link
                  href="/organizer/register"
                  className="block w-full text-center py-2 px-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  New here? Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

