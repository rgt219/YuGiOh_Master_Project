/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tcgplayer-cdn.tcgplayer.com',
      },
      {
        protocol: 'https',
        hostname: 'ms.yugipedia.com',
      },
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',
      }
    ],
  },
}

module.exports = nextConfig