/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development settings (only ignore errors in development)
  ...(process.env.NODE_ENV === "development" && {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
  }),

  // Production settings
  ...(process.env.NODE_ENV === "production" && {
    output: "standalone",
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
  }),

  images: {
    domains: ["res.cloudinary.com", "images.unsplash.com"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
