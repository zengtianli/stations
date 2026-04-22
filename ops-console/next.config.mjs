/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // site-navbar.html is read at request time via fs.readFileSync;
  // tell Next's file-tracing to bundle it into the standalone output.
  outputFileTracingIncludes: {
    "/*": ["./site-navbar.html"],
  },
}
export default nextConfig
