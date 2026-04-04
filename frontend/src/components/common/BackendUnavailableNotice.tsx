import Link from "next/link";

interface BackendUnavailableNoticeProps {
  title?: string;
  message?: string;
}

export function BackendUnavailableNotice({
  title = "Trip data is temporarily unavailable",
  message = "We could not reach the trip service just now. If you are running locally, make sure the FastAPI backend is running on http://localhost:8000 or set NEXT_PUBLIC_API_BASE_URL to the correct backend URL.",
}: BackendUnavailableNoticeProps) {
  return (
    <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
        Backend unavailable
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/discover"
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Explore categories
        </Link>
        <Link
          href="/trips/search"
          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
        >
          Open search
        </Link>
      </div>
    </div>
  );
}
