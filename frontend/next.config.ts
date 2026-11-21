import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Hide development indicator for cleaner UX
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zlsijkmythaxtqrjocza.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
