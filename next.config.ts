import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Ensure .env.local is loaded before the dev server handles requests
loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {};

export default nextConfig;
