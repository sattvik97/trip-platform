"use client";

import { useState } from "react";

type DateMode = "exact" | "flexible" | "month";

interface FlexibleDatePickerProps {
  mode: DateMode;
  onModeChange: (mode: DateMode) => void;
  exactStartDate: string;
  exactEndDate: string;
  onExactDatesChange: (start: string, end: string) => void;
  flexibleStartDate: string;
  flexibleEndDate: string;
  onFlexibleDatesChange: (start: string, end: string) => void;
  month: string;
  onMonthChange: (month: string) => void;
}

export function FlexibleDatePicker({
  mode,
  onModeChange,
  exactStartDate,
  exactEndDate,
  onExactDatesChange,
  flexibleStartDate,
  flexibleEndDate,
  onFlexibleDatesChange,
  month,
  onMonthChange,
}: FlexibleDatePickerProps) {
  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange("exact")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "exact"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Exact Dates
        </button>
        <button
          type="button"
          onClick={() => onModeChange("flexible")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "flexible"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Flexible Range
        </button>
        <button
          type="button"
          onClick={() => onModeChange("month")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "month"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Month
        </button>
      </div>

      {/* Exact dates mode */}
      {mode === "exact" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={exactStartDate}
              onChange={(e) => onExactDatesChange(e.target.value, exactEndDate)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={exactEndDate}
              onChange={(e) => onExactDatesChange(exactStartDate, e.target.value)}
              min={exactStartDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Flexible range mode */}
      {mode === "flexible" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Range Start
            </label>
            <input
              type="date"
              value={flexibleStartDate}
              onChange={(e) => onFlexibleDatesChange(e.target.value, flexibleEndDate)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Range End
            </label>
            <input
              type="date"
              value={flexibleEndDate}
              onChange={(e) => onFlexibleDatesChange(flexibleStartDate, e.target.value)}
              min={flexibleStartDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Month mode */}
      {mode === "month" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

