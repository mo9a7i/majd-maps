import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/majd-maps",
  images: { unoptimized: true },
};

export default nextConfig;
