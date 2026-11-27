/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Only this site and the portfolio's live preview may show it in a frame.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://vaibhavgawad.com https://www.vaibhavgawad.com",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
