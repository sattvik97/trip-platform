/**
 * Central API configuration for the frontend.
 * 
 * Reads API base URL from environment variable NEXT_PUBLIC_API_BASE_URL.
 * 
 * In Next.js, environment variables prefixed with NEXT_PUBLIC_ are
 * available in the browser and must be set at build time.
 * 
 * For different environments:
 * - local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
 * - test: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 (backend runs locally with Azure DB)
 * - production: NEXT_PUBLIC_API_BASE_URL=https://your-azure-backend.azurewebsites.net
 */
const getApiBaseUrl = (): string => {
  // Check for Next.js environment variable
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Fallback to localhost for local development
  // This should only be used if no environment variable is set
  // In production, this should never be used - env var must be set
  return 'http://localhost:8000';
};

/**
 * Get the full API base URL.
 * Returns the configured API base URL, ensuring it doesn't end with a slash.
 */
export const getApiBase = (): string => {
  const base = getApiBaseUrl();
  // Remove trailing slash if present
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

/**
 * Build a full API URL from a path.
 * @param path - API path (e.g., '/api/v1/trips')
 * @returns Full URL (e.g., 'http://localhost:8000/api/v1/trips')
 */
export const buildApiUrl = (path: string): string => {
  const base = getApiBase();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If base is empty, return just the path (relative URL)
  if (!base) {
    return normalizedPath;
  }
  
  return `${base}${normalizedPath}`;
};

/**
 * Get the API base URL (for backward compatibility and direct usage).
 */
export const API_BASE_URL = getApiBase();

/**
 * Helper function to get a full image URL.
 * If the image URL is already absolute (starts with http:// or https://), return it as-is.
 * Otherwise, prepend the API base URL.
 * 
 * This is useful for handling image URLs that can be either:
 * - Relative URLs from local storage (e.g., "/media/trips/...")
 * - Absolute URLs from Azure Blob Storage (e.g., "https://...")
 * 
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns The full image URL
 */
export const getImageUrl = (imageUrl: string): string => {
  // If URL is already absolute, return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  // If URL is relative, prepend API base URL
  const base = getApiBase();
  return `${base}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

