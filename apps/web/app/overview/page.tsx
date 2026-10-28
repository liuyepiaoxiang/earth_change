import { loadOverviewData } from "@future-earth/spec/overview-data";
import OverviewContent from "./OverviewContent";
import { tokens } from "../../lib/design";

export default function OverviewPage() {
  return (
    <main style={{ minHeight: "100vh", background: tokens.bg, color: tokens.text }}>
      <OverviewContent data={loadOverviewData()} />
    </main>
  );
}
