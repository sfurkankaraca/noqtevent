import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // serverActions.bodySizeLimit type missing in NextConfig but supported at runtime
  ...(({ serverActions: { bodySizeLimit: "10mb" } }) as object),
};

export default nextConfig;
