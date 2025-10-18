/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    // Use in-memory cache in dev to avoid filesystem pack cache serialization overhead warnings
    if (dev) {
      config.cache = { type: 'memory' };
    }
    return config;
  },
}

export default nextConfig
