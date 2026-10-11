/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@future-earth/spec", "@future-earth/data", "@future-earth/engine"],
};
export default nextConfig;
