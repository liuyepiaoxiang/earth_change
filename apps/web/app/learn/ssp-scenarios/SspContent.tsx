"use client";
import LearnLayout from "../LearnLayout";
import { learnStyle } from "../styles";
import { useI18n } from "../../../lib/i18n";

/** SSP 情景讲解——双语内容（默认 SSR 英文，利于英文 SEO；?lang=zh / 切换器转中文） */
export default function Content() {
  const { locale } = useI18n();
  const zh = locale === "zh";
  const T = zh
    ? {
        title: "什么是 SSP 情景？IPCC 共享社会经济路径详解",
        intro1: <strong>SSP 即共享社会经济路径（Shared Socioeconomic Pathway）。</strong>,
        intro2: "这是 IPCC（政府间气候变化专门委员会）使用的标准化情景，用于预测在不同温室气体排放水平下，全球温度、海平面和气候影响将如何演变。共有五个主要 SSP 情景，每一个代表人类的一种可能未来。",
        h2_main: "四个主要 SSP 情景",
        p_main: "每个 SSP 由两组数字命名：第一组表示社会经济路径（1–5），第二组表示 2100 年的辐射强迫水平（单位：瓦/平方米）。",
        th_scenario: "情景", th_name: "名称", th_warming: "2100 升温", th_desc: "说明",
        d126: "低排放。快速转向清洁能源与可持续生活方式，与巴黎协定 1.5°C 目标一致。",
        d245: "中间排放。历史模式延续、渐进改善。最常用的基准情景。",
        d370: "中高排放。民族主义回潮、国际合作减少、能源安全优先。",
        d585: "高排放。化石燃料驱动的快速增长，常作为「最坏情形」使用。",
        h2_numbers: "数字是什么意思？",
        p_numbers: "破折号后的数字（如 2.6、4.5、8.5）表示 2100 年的辐射强迫（W/m²）——即温室气体造成的入射太阳辐射与出射红外辐射之间的能量失衡。",
        p_perspective: "直观对比：",
        h2_temp: "各情景下温度会升多少？",
        p_temp: "根据 IPCC AR6（第六次评估报告，2021），相对工业化前（1850–1900 基线）的全球升温最佳估计为：",
        th_best: "最佳估计", th_range: "可能区间", th_co2: "2100 CO₂",
        source: "来源：IPCC AR6 WG1, Table SPM.1 (2021)",
        h2_why: "情景为什么重要？",
        p_why: "SSP1-2.6 与 SSP5-8.5 到 2100 年相差约 2.6°C 升温，这意味着：",
        li_slr: "海平面：2100 年上升 0.4 米 vs 0.8 米（2500 年差距更大）",
        li_ice: "北极海冰：所有情景下 2050 年前后都可能出现夏季无冰，但高排放下将成常态",
        li_coral: "珊瑚礁：1.5°C 时 70–90% 退化 vs 2°C 时 >99%",
        li_heat: "极端高温：2°C 时热浪频率约为 1.5°C 的两倍",
        h2_interactive: "互动 SSP 可视化",
        p_interactive: "我们的互动气候模拟器可以拖动 2026–2500 时间轴，查看每个 SSP 情景下温度、海平面与城市淹没的精确变化。所有预测经 IPCC AR6 数据校准。",
        cta: "🌍 打开互动 SSP 模拟器 →",
        h2_faq: "常见问题",
        q1: "哪个 SSP 情景最可能发生？",
        a1: "SSP2-4.5 常作为「中间路线」基准。按当前政策，人类大约处于 SSP2-4.5 至 SSP3-7.0 之间，2100 年升温最佳估计约 2.5–3°C。",
        q2: "SSP5-8.5 还现实吗？",
        a2: "有研究者认为随着可再生能源成本下降与气候政策推进，SSP5-8.5 越来越不可能。但它作为风险评估的「最坏情形」仍有价值，物理上也仍然可能。",
        q3: "RCP 和 SSP 有什么区别？",
        a3: "RCP（代表性浓度路径）用于 IPCC AR5，只描述温室气体浓度。SSP 增加了导致这些浓度的社会经济叙事（世界如何发展），情景内部一致性更强。",
        warning: "⚠ 注：2100 年后的预测为探索性外推，置信度低于 2100 年内。",
      }
    : {
        title: "What Are SSP Scenarios? IPCC Shared Socioeconomic Pathways Explained",
        intro1: <strong>SSP stands for Shared Socioeconomic Pathway.</strong>,
        intro2: "These are standardized scenarios used by the IPCC (Intergovernmental Panel on Climate Change) to project how global temperatures, sea levels, and climate impacts will change under different levels of greenhouse gas emissions. There are five main SSP scenarios, each representing a different possible future for humanity.",
        h2_main: "The Four Main SSP Scenarios",
        p_main: "Each SSP is named with two numbers: the first indicates the socioeconomic pathway (1-5), and the second indicates the radiative forcing level by 2100 (in watts per square meter).",
        th_scenario: "Scenario", th_name: "Name", th_warming: "2100 Warming", th_desc: "Description",
        d126: "Low emissions. Rapid transition to clean energy, sustainable lifestyles. Consistent with Paris Agreement 1.5°C goal.",
        d245: "Intermediate emissions. Historical patterns continue with gradual improvements. Most commonly used baseline.",
        d370: "Medium-high emissions. Resurgent nationalism, reduced international cooperation, energy security concerns.",
        d585: "High emissions. Rapid economic growth powered by fossil fuels. Often used as \"worst case\" scenario.",
        h2_numbers: "What Do the Numbers Mean?",
        p_numbers: "The number after the dash (e.g., 2.6, 4.5, 8.5) represents the radiative forcing in watts per square meter (W/m²) by the year 2100 — the imbalance between incoming solar and outgoing infrared energy caused by greenhouse gases.",
        p_perspective: "To put this in perspective:",
        h2_temp: "How Much Will Temperatures Rise Under Each Scenario?",
        p_temp: "According to IPCC AR6 (Sixth Assessment Report, 2021), the best estimates for global temperature rise above pre-industrial levels (1850-1900 baseline) are:",
        th_best: "Best Estimate", th_range: "Likely Range", th_co2: "CO₂ 2100",
        source: "Source: IPCC AR6 WG1, Table SPM.1 (2021)",
        h2_why: "Why Do Scenarios Matter?",
        p_why: "The difference between SSP1-2.6 and SSP5-8.5 is about 2.6°C of warming by 2100. This translates to:",
        li_slr: "Sea level: 0.4m vs 0.8m rise by 2100 (and much more by 2500)",
        li_ice: "Arctic ice: Ice-free summers possible under all scenarios by 2050, but permanent under high emissions",
        li_coral: "Coral reefs: 70-90% decline at 1.5°C vs >99% at 2°C",
        li_heat: "Extreme heat: Heatwave frequency doubles at 2°C vs 1.5°C",
        h2_interactive: "Interactive SSP Visualization",
        p_interactive: "Our interactive climate simulator lets you drag a timeline from 2026 to 2500 and see exactly how temperature, sea level, and city flooding change under each SSP scenario. All projections are calibrated against IPCC AR6 data.",
        cta: "🌍 Try the Interactive SSP Simulator →",
        h2_faq: "Frequently Asked Questions",
        q1: "Which SSP scenario is most likely?",
        a1: "SSP2-4.5 is often used as a \"middle of the road\" baseline. However, current policies put us on track for approximately SSP2-4.5 to SSP3-7.0, with best estimates around 2.5-3°C warming by 2100.",
        q2: "Is SSP5-8.5 still plausible?",
        a2: "Some researchers argue SSP5-8.5 is increasingly unlikely due to renewable energy cost reductions and climate policies. However, it remains useful as a \"worst case\" for risk assessment and is still physically possible.",
        q3: "What is the difference between RCP and SSP?",
        a3: "RCP (Representative Concentration Pathway) was used in IPCC AR5 and only described greenhouse gas concentrations. SSP adds socioeconomic narratives (how the world develops) that lead to those concentrations, making scenarios more internally consistent.",
        warning: "⚠ Note: These projections extend beyond 2100 as exploratory scenarios. Confidence decreases for projections beyond 2100.",
      };

  return (
    <LearnLayout title={T.title}>
      <p style={learnStyle.p}>
        {T.intro1} {T.intro2}
      </p>

      <h2 style={learnStyle.h2}>{T.h2_main}</h2>
      <p style={learnStyle.p}>{T.p_main}</p>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>{T.th_scenario}</th>
            <th style={learnStyle.th}>{T.th_name}</th>
            <th style={learnStyle.th}>{T.th_warming}</th>
            <th style={learnStyle.th}>{T.th_desc}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}><strong>SSP1-2.6</strong></td><td style={learnStyle.td}>{zh ? "可持续发展" : "Sustainability"}</td><td style={learnStyle.td}>~1.8°C</td><td style={learnStyle.td}>{T.d126}</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP2-4.5</strong></td><td style={learnStyle.td}>{zh ? "中间路线" : "Middle of the Road"}</td><td style={learnStyle.td}>~2.7°C</td><td style={learnStyle.td}>{T.d245}</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP3-7.0</strong></td><td style={learnStyle.td}>{zh ? "区域竞争" : "Regional Rivalry"}</td><td style={learnStyle.td}>~3.6°C</td><td style={learnStyle.td}>{T.d370}</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP5-8.5</strong></td><td style={learnStyle.td}>{zh ? "化石燃料发展" : "Fossil-fueled Development"}</td><td style={learnStyle.td}>~4.4°C</td><td style={learnStyle.td}>{T.d585}</td></tr>
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>{T.h2_numbers}</h2>
      <p style={learnStyle.p}>{T.p_numbers}</p>
      <p style={learnStyle.p}>{T.p_perspective}</p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li>{zh ? "工业化前 CO₂：~280 ppm → 附加强迫 0 W/m²" : "Pre-industrial CO₂ level: ~280 ppm → 0 W/m² additional forcing"}</li>
        <li>{zh ? "当前（2024）CO₂：~423 ppm → ~2.9 W/m²" : "Current (2024) CO₂ level: ~423 ppm → ~2.9 W/m²"}</li>
        <li>{zh ? "SSP1-2.6：CO₂ 峰值 ~445 ppm → 2100 年 2.6 W/m²" : "SSP1-2.6: CO₂ peaks at ~445 ppm → 2.6 W/m² by 2100"}</li>
        <li>{zh ? "SSP5-8.5：CO₂ 达 ~1,135 ppm → 2100 年 8.5 W/m²" : "SSP5-8.5: CO₂ reaches ~1,135 ppm → 8.5 W/m² by 2100"}</li>
      </ul>

      <h2 style={learnStyle.h2}>{T.h2_temp}</h2>
      <p style={learnStyle.p}>{T.p_temp}</p>
      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>{T.th_scenario}</th>
            <th style={learnStyle.th}>{T.th_best}</th>
            <th style={learnStyle.th}>{T.th_range}</th>
            <th style={learnStyle.th}>{T.th_co2}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}>SSP1-2.6</td><td style={learnStyle.td}>1.8°C</td><td style={learnStyle.td}>1.3 – 2.4°C</td><td style={learnStyle.td}>~445 ppm</td></tr>
          <tr><td style={learnStyle.td}>SSP2-4.5</td><td style={learnStyle.td}>2.7°C</td><td style={learnStyle.td}>2.1 – 3.5°C</td><td style={learnStyle.td}>~603 ppm</td></tr>
          <tr><td style={learnStyle.td}>SSP3-7.0</td><td style={learnStyle.td}>3.6°C</td><td style={learnStyle.td}>2.8 – 4.6°C</td><td style={learnStyle.td}>~867 ppm</td></tr>
          <tr><td style={learnStyle.td}>SSP5-8.5</td><td style={learnStyle.td}>4.4°C</td><td style={learnStyle.td}>3.3 – 5.7°C</td><td style={learnStyle.td}>~1,135 ppm</td></tr>
        </tbody>
      </table>
      <p style={learnStyle.source}>{T.source}</p>

      <h2 style={learnStyle.h2}>{T.h2_why}</h2>
      <p style={learnStyle.p}>{T.p_why}</p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li>{T.li_slr}</li>
        <li>{T.li_ice}</li>
        <li>{T.li_coral}</li>
        <li>{T.li_heat}</li>
      </ul>

      <h2 style={learnStyle.h2}>{T.h2_interactive}</h2>
      <p style={learnStyle.p}>{T.p_interactive}</p>
      <a href={`/?scenario=ssp245&year=2100${zh ? "&lang=zh" : ""}`} style={learnStyle.cta}>{T.cta}</a>

      <h2 style={learnStyle.h2}>{T.h2_faq}</h2>
      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>{T.q1}</h3>
      <p style={learnStyle.p}>{T.a1}</p>
      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>{T.q2}</h3>
      <p style={learnStyle.p}>{T.a2}</p>
      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>{T.q3}</h3>
      <p style={learnStyle.p}>{T.a3}</p>

      <div style={learnStyle.warning}>{T.warning}</div>
    </LearnLayout>
  );
}
