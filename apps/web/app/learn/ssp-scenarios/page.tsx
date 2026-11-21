import type { Metadata } from "next";
import Content from "./SspContent";

export const metadata: Metadata = {
  title: "SSP 情景是什么？IPCC 共享社会经济路径详解",
  description: "通俗解读 SSP1-2.6 / SSP2-4.5 / SSP3-7.0 / SSP5-8.5 四种情景：各自路径下 2100 年会升温多少？含互动可视化与 IPCC AR6 数据表。",
  alternates: { canonical: "https://earth-change.vercel.app/learn/ssp-scenarios" },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What are SSP scenarios?", acceptedAnswer: { "@type": "Answer", text: "SSP (Shared Socioeconomic Pathway) are standardized climate scenarios used by the IPCC: SSP1-2.6 low emissions, SSP2-4.5 intermediate, SSP3-7.0 medium-high, SSP5-8.5 very high emissions." } },
    { "@type": "Question", name: "How much will temperatures rise by 2100?", acceptedAnswer: { "@type": "Answer", text: "Under SSP2-4.5 around 2.7-2.9°C and under SSP5-8.5 around 4.3-4.9°C above pre-industrial levels (IPCC AR6 assessed ranges)." } },
    { "@type": "Question", name: "Which scenario are we currently on?", acceptedAnswer: { "@type": "Answer", text: "Current policies put the world closest to SSP2-4.5 to SSP3-7.0; see the interactive simulator to compare pathways." } },
  ],
};

export default function SSPScenariosPage() {
  return (
    <>
      {/* 审计 SEO-07：FAQPage schema 收敛到可见 FAQ 所在页（原挂根 layout 全站错配） */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <Content />
    </>
  );
}
