import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { I18nProvider } from "../lib/i18n";
import "./animations.css";

const SITE_URL = "https://earth-change.vercel.app";
const SITE_NAME = "未来地球引擎 Future Earth Engine";
const SITE_DESC = "拖动时间轴看地球从 2026 到 2500 年的变化——3D 地球、城市淹没模拟、气候实验。基于 NASA 数据校准的互动气候模拟器。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: "Cv8r7GjGtspf_LKoBf3B0bTODUPGzf7J4aZocHAQStw",
  },
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
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is the Future Earth Engine?", acceptedAnswer: { "@type": "Answer", text: "An interactive climate simulator that lets you drag a timeline from 2026 to 2500 on a 3D globe to see temperature, sea level, and city flooding changes. Based on NASA and IPCC AR6 data." } },
      { "@type": "Question", name: "How accurate is the model?", acceptedAnswer: { "@type": "Answer", text: "Calibrated against 175 years of NASA GISTEMP observations with RMSE under 0.2°C. 2100 projections fall within IPCC AR6 ranges for all four SSP scenarios." } },
      { "@type": "Question", name: "What are SSP scenarios?", acceptedAnswer: { "@type": "Answer", text: "SSP (Shared Socioeconomic Pathway) are standardized climate scenarios used by IPCC. SSP1-2.6 is low emissions, SSP2-4.5 intermediate, SSP3-7.0 medium-high, SSP5-8.5 high emissions." } },
      { "@type": "Question", name: "Will my city flood?", acceptedAnswer: { "@type": "Answer", text: "Click any of 500 major cities to see elevation, local warming, and flooding status at any year through 2500." } },
      { "@type": "Question", name: "Can I run my own experiments?", acceptedAnswer: { "@type": "Answer", text: "Yes. The Lab feature lets you adjust emission intensity, net-zero year, methane paths, and coastal defense to see how choices affect outcomes." } },
    ],
  };
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <I18nProvider>{children}</I18nProvider>
        <noscript>
          <div style={{ padding: 40, maxWidth: 640, margin: "0 auto" }}>
            <h1>🌍 {SITE_NAME} — Interactive Climate Simulator</h1>
            <p>{SITE_DESC}</p>
            <h2>Key Facts</h2>
            <ul>
              <li>SSP2-4.5 warming by 2100: ~2.8°C (IPCC AR6)</li>
              <li>SSP5-8.5 warming by 2100: ~4.9°C (IPCC AR6)</li>
              <li>Sea level rise by 2100 (SSP2-4.5): ~0.7m</li>
              <li>Model calibrated against NASA GISTEMP (1850-2024)</li>
            </ul>
            <h2>What You Can Do</h2>
            <ul>
              <li>Drag a timeline from 2026 to 2500 on a 3D globe</li>
              <li>Watch cities flood as sea levels rise</li>
              <li>Run your own climate experiments</li>
              <li>Compare emission scenarios (SSP1-2.6 to SSP5-8.5)</li>
              <li>See impact metrics for 500 major cities</li>
            </ul>
            <p>Data sources: NASA GISTEMP v4, NOAA CO₂, IPCC AR6, Global Carbon Project, GeoNames, WorldClim 2.1.</p>
            <p><a href="/overview">Model Overview</a> | <a href="/api/simulate?scenario=ssp245&amp;horizon=2100">API</a></p>
          </div>
        </noscript>
        <div style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
          <h1>{SITE_NAME} — 互动气候模拟器</h1>
          <p>拖动时间轴看地球从 2026 到 2500 年的变化。3D 地球、城市淹没模拟、气候实验、影响评估。基于 NASA GISTEMP 和 IPCC AR6 数据校准。</p>
          <h2>功能</h2>
          <p>四情景（SSP1-2.6 / SSP2-4.5 / SSP3-7.0 / SSP5-8.5）气候预测、500 城市淹没查询、自定义排放实验、蒙特卡洛不确定性分析、影响评估（人口暴露/水资源/经济损害）、临界点诊断（AMOC/冰盖/冻土）、里程碑事件通知。</p>
          <h2>数据源</h2>
          <p>NASA GISTEMP v4（温度）、NOAA GML + Law Dome（CO₂）、Global Carbon Project（排放）、IPCC AR6（情景校准）、GeoNames + WorldClim 2.1（城市/高程/气候）。</p>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
