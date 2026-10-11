/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@future-earth/spec", "@future-earth/data", "@future-earth/engine"],
  webpack(config) {
    // workspace 包以 TS 源分发，import 使用 .js 后缀（ESM 惯例）——映射回 .ts
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};
export default nextConfig;
