/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Proxy all /api/* calls to the Spring gateway — no CORS issues
  async rewrites() {
    const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:8080'
    return [
      {
        source: '/api/:path*',
        destination: `${gatewayUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
