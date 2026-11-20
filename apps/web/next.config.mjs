/** @type {import('next').NextConfig} */
const SECURITY_HEADERS = [
  // 审计 SEC-01：基础安全头（CSP script-src 起步不收紧——Next inline/bootstrap 需 nonce 配套，见 docs/20 §F Phase 3）
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // 审计 SEC-02：默认禁止被第三方 iframe 嵌入（防点击劫持）；/embed 路径单独覆盖为允许任意站
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@future-earth/spec", "@future-earth/data", "@future-earth/engine"],
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // embed 页的存在意义就是被第三方 iframe 嵌入：显式放行任意 frame-ancestors
        source: "/embed",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
  webpack(config) {
    // workspace 包以 TS 源分发，import 使用 .js 后缀（ESM 惯例）——映射回 .ts
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};
export default nextConfig;
