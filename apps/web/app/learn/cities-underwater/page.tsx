import type { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
  title: "Which Cities Will Be Underwater by 2050, 2100, and 2500?",
  description: "Interactive map of cities at risk from sea level rise. See if Shanghai, Miami, Jakarta, Bangkok, Mumbai and 500+ cities will flood under different climate scenarios.",
  alternates: { canonical: "https://earth-change.vercel.app/learn/cities-underwater" },
};

export default function CitiesUnderwaterPage() {
  return <Content />;
}
