import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from Azure Blob Storage
    // Azure Blob Storage URLs follow the pattern: https://{account}.blob.core.windows.net/{container}/{blob}
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
        pathname: "/**",
      },
    ],
    // Since we're using regular <img> tags (not next/image), this config is for future-proofing
    // and won't affect current implementation
  },
};

export default nextConfig;
