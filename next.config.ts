import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile elsewhere in the
  // home directory doesn't get picked up.
  turbopack: {
    root: path.resolve(),
  },
};

export default nextConfig;
