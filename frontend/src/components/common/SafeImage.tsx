"use client";

import { useState } from "react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  alt: string;
}

/**
 * SafeImage component with error handling.
 * Shows a fallback UI if the image fails to load.
 */
export function SafeImage({
  src,
  alt,
  fallback,
  className,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 ${className || ""}`}
      >
        {fallback || (
          <div className="text-white text-4xl font-bold opacity-80">
            {alt.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setHasError(true);
        setIsLoading(false);
      }}
      onLoad={() => setIsLoading(false)}
      loading={props.loading || "lazy"}
      {...props}
    />
  );
}

