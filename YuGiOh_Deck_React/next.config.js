/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ⚡ Tells Next.js to generate the static 'out/' folder
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;