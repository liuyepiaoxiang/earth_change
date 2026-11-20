import type { Metadata } from "next";
import Content from "./SspContent";

export const metadata: Metadata = {
  title: "SSP 情景是什么？IPCC 共享社会经济路径详解",
  description: "通俗解读 SSP1-2.6 / SSP2-4.5 / SSP3-7.0 / SSP5-8.5 四种情景：各自路径下 2100 年会升温多少？含互动可视化与 IPCC AR6 数据表。",
  alternates: { canonical: "https://earth-change.vercel.app/learn/ssp-scenarios" },
};

export default function SSPScenariosPage() {
  return <Content />;
}
