/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint warnings for img elements since we're using them intentionally for retro styling
    ignoreDuringBuilds: false,
  },
  // Allow img elements for retro styling
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
