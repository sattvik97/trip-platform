"use client";

import { useEffect } from "react";

interface ResultCountProviderProps {
  count: number;
  children: React.ReactNode;
}

export function ResultCountProvider({ count, children }: ResultCountProviderProps) {
  useEffect(() => {
    const header = document.querySelector('[data-result-count]');
    if (header) {
      header.textContent = `${count} ${count === 1 ? "trip" : "trips"} found`;
    }
  }, [count]);

  return <>{children}</>;
}

