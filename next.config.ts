import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so the stray lockfile in the user home
    // directory doesn't confuse module resolution.
    root: __dirname,
  },
};

export default nextConfig;
