"use client";

import { useSearchParams, useRouter } from "next/navigation";

type TripTag =
  | "TREK"
  | "BACKPACKING"
  | "STARGAZING"
  | "RELAXING"
  | "ADVENTURE"
  | "SOLO"
  | "GROUP"
  | "WOMEN_ONLY"
  | "WOMEN_FRIENDLY"
  | "BEGINNER_FRIENDLY"
  | "WEEKEND"
  | "MULTI_DAY"
  | "HIGH_ALTITUDE"
  | "CULTURAL_EXPERIENCE"
  | "NATURE_RETREAT"
  | "PHOTOGRAPHY"
  | "INSTAGRAMMABLE"
  | "BUDGET"
  | "MID_RANGE"
  | "PREMIUM";

const ALL_TAGS: TripTag[] = [
  "TREK",
  "BACKPACKING",
  "STARGAZING",
  "RELAXING",
  "ADVENTURE",
  "SOLO",
  "GROUP",
  "WOMEN_ONLY",
  "WOMEN_FRIENDLY",
  "BEGINNER_FRIENDLY",
  "WEEKEND",
  "MULTI_DAY",
  "HIGH_ALTITUDE",
  "CULTURAL_EXPERIENCE",
  "NATURE_RETREAT",
  "PHOTOGRAPHY",
  "INSTAGRAMMABLE",
  "BUDGET",
  "MID_RANGE",
  "PREMIUM",
];

function TagChip({
  tag,
  isSelected,
  onToggle,
}: {
  tag: TripTag;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        isSelected
          ? "bg-blue-600 text-white shadow-md"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {tag.replace(/_/g, " ")}
    </button>
  );
}

export function TagFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Get all selected tags (array)
  const selectedTags = searchParams.getAll("tag") as TripTag[];

  const handleTagToggle = (tag: TripTag) => {
    const params = new URLSearchParams(searchParams.toString());

    // Get current tags
    const currentTags = params.getAll("tag");

    if (currentTags.includes(tag)) {
      // Remove tag if already selected
      // Delete all tag params and re-add the ones we want to keep
      params.delete("tag");
      currentTags
        .filter((t) => t !== tag)
        .forEach((t) => params.append("tag", t));
    } else {
      // Add new tag
      params.append("tag", tag);
    }

    // Reset to page 1 when changing filters
    params.delete("page");

    router.push(`/trips?${params.toString()}`);
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Tag</h2>
      <div className="flex flex-wrap gap-3">
        {ALL_TAGS.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            isSelected={selectedTags.includes(tag)}
            onToggle={() => handleTagToggle(tag)}
          />
        ))}
      </div>
    </div>
  );
}

