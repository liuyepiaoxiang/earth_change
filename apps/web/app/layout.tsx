import type { Metadata, Viewport } from "next";
import "./animations.css";

const SITE_URL = "https://earth-change.vercel.app";
const SITE_NAME = "未来地球引擎 Future Earth Engine";
const SITE_DESC = "拖动时间轴看地球从 2026 到 2500 年的变化——3D 地球、城市淹没模拟、气候实验。基于 NASA 数据校准的互动气候模拟器。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 互动气候模拟器`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "气候模拟", "climate simulator", "全球变暖", "global warming",
    "海平面上升", "sea level rise", "IPCC", "SSP 情景",
    "地球 3D", "interactive earth", "气候实验", "climate experiment",
    "未来预测", "future prediction", "环境教育", "climate education",
  ],
  authors: [{ name: "Future Earth Engine" }],
  creator: "Future Earth Engine",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 拖动时间轴看地球的未来`,
    description: SITE_DESC,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "未来地球引擎 — 3D 地球气候模拟器" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 互动气候模拟器`,
    description: SITE_DESC,
    images: ["/og-image.png"],
    creator: "@future_earth",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: "#05070f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESC,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "3D 地球温度场可视化",
      "海平面淹没模拟",
      "四情景（SSP）气候预测",
      "城市级气候查询",
      "自定义排放实验",
      "影响评估（人口暴露/水资源/经济损害）",
    ],
  };
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
