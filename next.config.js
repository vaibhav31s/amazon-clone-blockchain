/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      'lh3.googleusercontent.com',
      'openseauserdata.com',
      'brand.assets.adidas.com',
      'media0.giphy.com',
      'avatars.dicebear.com',
      'media1.giphy.com',
      'media3.giphy.com',
      'media2.giphy.com',
      'media4.giphy.com',
    ].map(hostname => ({ protocol: 'https', hostname })),
  },
}

module.exports = nextConfig
