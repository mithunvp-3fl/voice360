/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vo360/shared', '@vo360/checklists'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
