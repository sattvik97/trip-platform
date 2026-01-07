"use client";

import { useState, useRef, useEffect } from "react";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
  label: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = (v) => v.toString(),
  label,
}: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  const handlePointerDown = (type: "min" | "max") => {
    setIsDragging(type);
  };

  const getValueFromEvent = (clientX: number) => {
    if (!sliderRef.current) return null;
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );
    const newValue = Math.round(
      (percentage / 100) * (max - min) + min
    );
    const steppedValue = Math.round(newValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const clampedValue = getValueFromEvent(e.clientX);
      if (clampedValue === null) return;

      if (isDragging === "min") {
        const newMin = Math.min(clampedValue, value[1] - step);
        onChange([newMin, value[1]]);
      } else {
        const newMax = Math.max(clampedValue, value[0] + step);
        onChange([value[0], newMax]);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, min, max, step, value, onChange]);

  const minPercentage = getPercentage(value[0]);
  const maxPercentage = getPercentage(value[1]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="text-sm text-gray-600">
          {formatLabel(value[0])} - {formatLabel(value[1])}
        </div>
      </div>
      <div
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
      >
        <div
          className="absolute h-2 bg-blue-500 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />
        <div
          className="absolute w-4 h-4 bg-blue-600 rounded-full shadow-md cursor-grab active:cursor-grabbing transform -translate-y-1 -translate-x-1/2 hover:scale-110 transition-transform touch-none"
          style={{ left: `${minPercentage}%` }}
          onPointerDown={() => handlePointerDown("min")}
        />
        <div
          className="absolute w-4 h-4 bg-blue-600 rounded-full shadow-md cursor-grab active:cursor-grabbing transform -translate-y-1 -translate-x-1/2 hover:scale-110 transition-transform touch-none"
          style={{ left: `${maxPercentage}%` }}
          onPointerDown={() => handlePointerDown("max")}
        />
      </div>
    </div>
  );
}

