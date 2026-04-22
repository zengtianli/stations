/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@tlz/ui", "@tlz/tokens", "@tlz/menu-ssot", "@tlz/api-clients"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
  // Same-origin /api/* via rewrites — no NEXT_PUBLIC_API_BASE needed.
  // Dev: backend uvicorn on 8613 | Prod: standalone server forwards to 127.0.0.1:8613
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:8613/api/:path*" },
    ]
  },
}

export default nextConfig
