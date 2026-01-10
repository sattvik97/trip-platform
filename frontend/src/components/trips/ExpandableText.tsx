"use client";

import { useState, useRef, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function ExpandableText({
  text,
  maxLength = 500,
  className = "",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Check if text is longer than maxLength
    if (text.length > maxLength) {
      setShouldShowButton(true);
    } else {
      setShouldShowButton(false);
      setIsExpanded(true);
    }
  }, [text, maxLength]);

  const displayText = isExpanded || !shouldShowButton
    ? text
    : `${text.slice(0, maxLength)}...`;

  return (
    <div className={className}>
      <p
        ref={textRef}
        className="text-gray-700 leading-relaxed whitespace-pre-line text-lg md:text-xl"
      >
        {displayText}
      </p>
      {shouldShowButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-base md:text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}


