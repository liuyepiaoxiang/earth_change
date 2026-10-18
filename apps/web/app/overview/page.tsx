import { loadOverviewData } from "@future-earth/spec/overview-data";
import OverviewContent from "./OverviewContent";
import GuidedTour from "../../components/GuidedTour";
import { tokens } from "../../lib/design";

export default function OverviewPage() {
  const data = loadOverviewData();
  return (
    <main style={{ minHeight: "100vh", background: tokens.bg, color: tokens.text }}>
      <header className="overview-header">
        <div className="overview-header-brand"><span aria-hidden>🌍</span><strong>未来地球引擎</strong></div>
        <nav className="overview-main-nav" aria-label="主导航"><a href="/">地球模拟</a><span aria-current="page">模型导览</span></nav>
        <a href="/?scenario=ssp245&year=2100" className="overview-header-cta">开始实验 →</a>
      </header>
      <GuidedTour />
      <OverviewContent data={data} />
    </main>
  );
}
