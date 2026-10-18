/** 生成 OG 分享图（1200×630）——运行：npx tsx scripts/gen-og-image.ts */
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  // 构造一个简洁的 OG 卡片页面
  const html = `<!DOCTYPE html>
<html><head><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1200px; height:630px; background:linear-gradient(135deg,#05070f 0%,#0c1a2e 50%,#1a0a2e 100%); display:flex; flex-direction:column; justify-content:center; align-items:center; font-family:system-ui,sans-serif; overflow:hidden; }
.emoji { font-size:100px; margin-bottom:20px; }
h1 { color:#e0f2fe; font-size:56px; font-weight:800; margin-bottom:12px; text-shadow:0 4px 20px rgba(56,189,248,0.3); }
.sub { color:#38bdf8; font-size:24px; margin-bottom:30px; }
.tags { display:flex; gap:12px; }
.tag { padding:8px 20px; border:1px solid #334155; border-radius:20px; color:#94a3b8; font-size:16px; background:rgba(15,23,42,0.8); }
.footer { position:absolute; bottom:30px; color:#475569; font-size:14px; }
</style></head><body>
<div class="emoji">🌍</div>
<h1>未来地球引擎</h1>
<div class="sub">拖动时间轴 · 看地球 2026 → 2500</div>
<div class="tags">
<span class="tag">🌡️ 温度场</span>
<span class="tag">🌊 海平面</span>
<span class="tag">🏙️ 城市淹没</span>
<span class="tag">🧪 气候实验</span>
</div>
<div class="footer">earth-change.vercel.app · NASA 数据校准 · IPCC AR6 对标</div>
</body></html>`;

  await page.setContent(html);
  await page.screenshot({ path: "public/og-image.png", type: "png" });
  await browser.close();
  console.log("OG image saved: public/og-image.png (1200×630)");
}
main();
