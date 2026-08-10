/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // ❌ Remove this line if you want standard server-side/dynamic rendering
  images: {
    unoptimized: true,
  },
};

export default nextConfig;