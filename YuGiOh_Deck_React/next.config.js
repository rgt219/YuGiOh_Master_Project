/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ⚡ Forces Next.js to generate the /app/out folder during build
  images: {
    unoptimized: true, // Required for static export when using Next <Image />
  },
};

export default nextConfig;