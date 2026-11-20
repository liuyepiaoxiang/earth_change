import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私与条款 Privacy & Terms",
  description: "未来地球引擎的数据收集说明、使用条款与教育性免责声明。Privacy policy, terms of use, and educational disclaimer.",
  alternates: { canonical: "https://earth-change.vercel.app/legal" },
};

const H = { fontSize: 17, color: "#7dd3fc", marginTop: 26, marginBottom: 8 } as const;
const P = { color: "#cbd5e1", fontSize: 14, lineHeight: 1.8, marginBottom: 8 } as const;
const LI = { color: "#cbd5e1", fontSize: 14, lineHeight: 1.8, marginLeft: 20 } as const;

/** 审计 LEG-01：隐私/条款/免责三合一（zh-first + English 摘要）。免费工具，无账户无支付，采集面最小化。 */
export default function LegalPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #1e293b" }}>
        <a href="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: 14 }}>🌍 未来地球引擎</a>
        <span style={{ color: "#475569", margin: "0 8px" }}>|</span>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>隐私与条款</span>
      </header>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 80px" }}>
        <h1 style={{ fontSize: 24, color: "#e0f2fe", marginBottom: 6 }}>隐私政策 · 使用条款 · 免责声明</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>更新日期：2026-11-21 · Last updated: 2026-11-21</p>

        <h2 style={H}>一、我们收集什么（隐私政策）</h2>
        <p style={P}>本站是一个无需注册的免费教育工具。我们刻意将数据收集降到最低：</p>
        <ul style={{ padding: 0 }}>
          <li style={LI}><strong>本地存储（localStorage）</strong>：仅保存 4 个功能性偏好——语言选择（fe-locale）、首访小测标记（fe-quiz-intro）、任务完成进度（fe-missions）、你保存的实验（fe-lab-experiments，仅你自己可见）。这些数据<strong>只存在于你的浏览器</strong>，我们无法读取，清除浏览器数据即彻底删除。</li>
          <li style={LI}><strong>页面浏览统计</strong>：使用 Vercel Web Analytics（无 Cookie、不采集个人信息）统计页面访问量与来源国家，用于了解哪些内容有帮助。不使用任何广告或跨站追踪器。</li>
          <li style={LI}><strong>不收集</strong>：姓名、邮箱、密码、支付信息、精确位置——本站没有账户系统，也没有任何输入个人身份信息的表单。</li>
        </ul>

        <h2 style={H}>二、数据保留与删除</h2>
        <p style={P}>localStorage 中的数据保留在你自己的设备上，直到你清除浏览器数据或使用站内删除功能。页面浏览统计由 Vercel 按<a href="https://vercel.com/docs/analytics" style={{ color: "#38bdf8" }}>其隐私政策</a>处理（聚合、无 Cookie）。如对数据处理有疑问，可通过 GitHub 仓库 Issue 联系我们。</p>

        <h2 style={H}>三、教育性免责声明（重要）</h2>
        <p style={P}><strong>本站是教育性气候模拟工具，不是预报系统。</strong>所有 2026 年之后的数值均为情景推演（What-if），不是对未来的预测或承诺：</p>
        <ul style={{ padding: 0 }}>
          <li style={LI}>模型为两层能量平衡 + 碳循环的简化箱式模型（教育级），非 IPCC 使用的完整地球系统模式；</li>
          <li style={LI}>2100 年校准锚点取自 IPCC AR6 评估区间，但<strong>2101 年之后为探索性外推，置信度低</strong>（站内已标注）；</li>
          <li style={LI}>城市淹没为高程阈值判定，未考虑防洪设施、风暴潮、地下水等因素，<strong>不构成任何工程、保险或搬迁决策依据</strong>；</li>
          <li style={LI}>「气候问答」由规则引擎从模型结果生成，覆盖主题有限，非通用 AI 助手。</li>
        </ul>
        <p style={P}>决策请参考 IPCC 官方报告与你所在地区的权威气象机构。</p>

        <h2 style={H}>四、使用条款</h2>
        <ul style={{ padding: 0 }}>
          <li style={LI}>本站内容以「现状」提供，采用开源许可（见 GitHub 仓库）；教育与非商业用途免费。</li>
          <li style={LI}>引用本站数据时请注明：「未来地球引擎（earth-change.vercel.app），NASA/NOAA/IPCC AR6 数据校准的教育性模拟」。</li>
          <li style={LI}>嵌入服务（/embed）供课堂与文章合法嵌入；不得用于暗示本站认可第三方内容的展示方式。</li>
          <li style={LI}>我们不对因使用本站产生的任何直接或间接损失承担责任（法律允许的最大范围内）。</li>
        </ul>

        <h2 style={H}>Privacy Policy (English summary)</h2>
        <p style={P}>This free educational tool requires no account. We store only 4 functional preferences in your browser&apos;s localStorage (language, first-visit quiz flag, mission progress, saved experiments) — they never leave your device and are deleted when you clear browser data. Page views are counted by Vercel Web Analytics (cookieless, aggregated). We collect no names, emails, passwords, payment data, or precise location. All future-year values shown on this site are educational scenario simulations calibrated to IPCC AR6 ranges — <strong>not forecasts</strong> and not a basis for engineering, insurance, or relocation decisions. Contact: open an issue on our GitHub repository.</p>
      </article>
    </main>
  );
}
