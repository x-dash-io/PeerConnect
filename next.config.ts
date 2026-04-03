import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Ensure we don't use Turbopack which triggers the BMI2 panic
  // Note: Most Turbopack flags are now CLI-driven, but we keep this clean
}

export default nextConfig
