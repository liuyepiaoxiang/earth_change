import type { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
  title: "哪些城市会被淹没？2050 / 2100 / 2500 年城市风险查询",
  description: "500 个大城市在海平面上升下的淹没风险互动查询：上海、雅加达、曼谷、孟买等城市在不同气候情景下的首淹年份与高程对比。",
  alternates: { canonical: "https://earth-change.vercel.app/learn/cities-underwater" },
};

export default function CitiesUnderwaterPage() {
  return <Content />;
}
