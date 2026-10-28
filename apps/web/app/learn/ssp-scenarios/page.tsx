import type { Metadata } from "next";
import Content from "./SspContent";

export const metadata: Metadata = {
  title: "What Are SSP Scenarios? IPCC Shared Socioeconomic Pathways Explained",
  description: "SSP scenarios explained simply: SSP1-2.6, SSP2-4.5, SSP3-7.0, SSP5-8.5. How much will temperatures rise by 2100 under each pathway? Interactive visualization included.",
  alternates: { canonical: "https://earth-change.vercel.app/learn/ssp-scenarios" },
};

export default function SSPScenariosPage() {
  return <Content />;
}
