/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
      },
      {
        protocol: 'https',
        hostname: 'ygoprodeck.com',
      },
      {
        protocol: 'https',
        hostname: 'www.yugioh-card.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ygorganization.com',
      },
    ],
  },
}

module.exports = nextConfig