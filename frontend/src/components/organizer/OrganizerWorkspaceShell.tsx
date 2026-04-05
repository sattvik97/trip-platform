"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { useAuth } from "@/src/contexts/AuthContext";

interface OrganizerWorkspaceShellProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/organizer/overview", label: "Overview" },
  { href: "/organizer/trips", label: "Trips" },
  { href: "/organizer/bookings", label: "Bookings" },
  { href: "/organizer/finance", label: "Finance" },
  { href: "/organizer/profile", label: "Profile" },
];

export function OrganizerWorkspaceShell({
  title,
  eyebrow = "Organizer workspace",
  description,
  actions,
  children,
}: OrganizerWorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const activePath = useMemo(() => pathname || "/organizer/overview", [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f0ea]">
      <Header />
      <main className="flex-grow">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
          <aside className="self-start rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-950/5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Host HQ
            </p>
            <div className="mt-4 rounded-3xl bg-[#f7f1e8] p-4">
              <p className="text-sm font-semibold text-slate-950">{user?.email || "Organizer"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Run departures, review bookings, and keep payouts clear.
              </p>
            </div>

            <nav className="mt-5 grid gap-2">
              {NAV_ITEMS.map((item) => {
                const active =
                  activePath === item.href ||
                  (item.href !== "/organizer/overview" && activePath.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                        : "text-slate-700 hover:bg-[#f7f1e8] hover:text-slate-950"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                Logout
              </button>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-950/5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {eyebrow}
                  </p>
                  <h1 className="mt-2 font-display text-4xl font-semibold text-slate-950">{title}</h1>
                  {description && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
                  )}
                </div>
                {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
              </div>
            </div>

            <div className="mt-6">{children}</div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


export function OrganizerMetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-950/5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      {helper && <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>}
    </article>
  );
}
