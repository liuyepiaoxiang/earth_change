"use client";
import LearnLayout from "../LearnLayout";
import { learnStyle } from "../styles";
import { useI18n } from "../../../lib/i18n";

/** 海平面上升讲解——双语内容（默认 SSR 英文，利于英文 SEO） */
export default function Content() {
  const { locale } = useI18n();
  const zh = locale === "zh";
  const T = zh
    ? {
        title: "海平面到 2100 / 2500 年会上升多少？IPCC 预测",
        p_intro: <>全球海平面自 1900 年以来已上升约 <strong>0.20–0.25 米</strong>，且速率还在加快。IPCC AR6 指出：无论减排与否，海平面都将在未来数百年持续上升。问题是——升多少？</>,
        h2_proj: "各情景下的海平面上升预测",
        th_scenario: "情景", th_2050: "2050 年", th_2100: "2100 年", th_2150: "2150 年", th_2500: "2500 年",
        source: "来源：IPCC AR6 WG1, Table 9.9 (2021)。数值为相对 1995–2014 基线的可能区间。",
        h2_cause: "海平面为什么会上升？",
        p_cause: "海平面上升来自四个主要分量，贡献各不相同：",
        th_component: "分量", th_share: "2100 年占比", th_mech: "机制",
        c_thermal: "海水变暖膨胀。海洋已吸收 90% 的多余热量。",
        c_glacier: "冰川融化汇入海洋。",
        c_greenland: "表面消融与冰川崩解。",
        c_antarctic: "不确定性最大，存在快速崩塌的可能。",
        c_land: "水库蓄水 vs 地下水开采。",
        h2_cities: "哪些城市风险最高？",
        p_cities: "低海拔、人口多的大城市风险最大。中高排放下到 2100 年：",
        th_city: "城市", th_pop: "人口", th_elev: "高程", th_risk: "风险等级",
        risk_critical: "🔴 极高", risk_high: "🟡 高",
        h2_locked: "为什么海平面上升「已锁定」？",
        p_locked: "即使今天停止所有排放，海平面仍会继续上升数百年，原因包括：",
        li_inertia: "海洋热惯性：深海变暖需要数百年，膨胀将持续",
        li_ice: "冰盖动力学：格陵兰与南极冰盖响应缓慢但对变暖不可逆",
        li_carbon: "碳寿命：CO₂ 在大气中存留 300–1000 年",
        h2_see: "查看你所在城市的海平面上升",
        p_see: "互动模拟器可以显示每个城市在各排放情景下何时跨越淹没阈值。在 3D 地球上点击 500 个主要城市中的任何一个，查看它的专属时间线。",
        cta: "🌊 查看哪些城市将被淹没 →",
        h2_faq: "常见问题",
        q1: "1900 年以来海平面升了多少？",
        a1: "约 0.20 米（8 英寸）。速率已从 1901–1990 年的 ~1.4 mm/年 加速到 2006–2018 年的 ~3.7 mm/年。",
        q2: "沿海城市 2050 年会淹没吗？",
        a2: "大多数大城市 2050 年前不会被完全淹没，但许多低洼地区将在高潮位和风暴期间频繁遭遇「骚扰性洪水」。关键阈值约 0.5 米，多数情景在 2100 年前后达到。",
        q3: "我们能阻止海平面上升吗？",
        a3: "无法完全阻止，但可以显著减缓。低排放与高排放的差异：2100 年约 0.3 米，2500 年可达数米。",
        warning: "⚠ 2100 年之后的预测置信度较低，尤其是南极冰盖动力学。2500 年数值应视为探索性情景而非预测。",
      }
    : {
        title: "How Much Will Sea Levels Rise by 2100 and 2500?",
        p_intro: <>Global sea levels have already risen about <strong>0.20-0.25 meters since 1900</strong>, and the rate is accelerating. According to IPCC AR6, sea levels will continue rising for centuries regardless of emission reductions. The question is: how much?</>,
        h2_proj: "Sea Level Rise Projections by Scenario",
        th_scenario: "Scenario", th_2050: "By 2050", th_2100: "By 2100", th_2150: "By 2150", th_2500: "By 2500",
        source: "Source: IPCC AR6 WG1, Table 9.9 (2021). Values are likely ranges relative to 1995-2014 baseline.",
        h2_cause: "What Causes Sea Level Rise?",
        p_cause: "Sea level rise comes from four main components, each contributing differently:",
        th_component: "Component", th_share: "Share by 2100", th_mech: "Mechanism",
        c_thermal: "Ocean water expands as it warms. The ocean has absorbed 90% of excess heat.",
        c_glacier: "Glaciers melt and flow to the ocean.",
        c_greenland: "Surface melting and calving of glaciers.",
        c_antarctic: "Most uncertain. Potential for rapid collapse.",
        c_land: "Reservoir storage vs groundwater extraction.",
        h2_cities: "Which Cities Are Most at Risk?",
        p_cities: "Cities with low elevation and large populations face the greatest risk. By 2100 under medium-to-high emissions:",
        th_city: "City", th_pop: "Population", th_elev: "Elevation", th_risk: "Risk Level",
        risk_critical: "🔴 Critical", risk_high: "🟡 High",
        h2_locked: "Why Is Sea Level Rise Locked In?",
        p_locked: "Even if we stopped all emissions today, sea levels would continue rising for centuries. This is because:",
        li_inertia: "Ocean heat inertia: the deep ocean takes centuries to warm; expansion continues",
        li_ice: "Ice sheet dynamics: Greenland and Antarctic ice sheets respond slowly but irreversibly to warming",
        li_carbon: "Carbon lifetime: CO₂ stays in the atmosphere for 300-1000 years",
        h2_see: "See Sea Level Rise in Your City",
        p_see: "Our interactive simulator shows exactly when each city crosses the flooding threshold under each emission scenario. Click any of 500 major cities on the 3D globe to see its specific timeline.",
        cta: "🌊 See Which Cities Will Flood →",
        h2_faq: "Frequently Asked Questions",
        q1: "How much has sea level risen since 1900?",
        a1: "About 0.20 meters (8 inches). The rate has accelerated from ~1.4 mm/year (1901-1990) to ~3.7 mm/year (2006-2018).",
        q2: "Will coastal cities be underwater by 2050?",
        a2: "Most major cities will not be fully underwater by 2050, but many low-lying areas will experience regular \"nuisance flooding\" during high tides and storms. The critical threshold is around 0.5m rise, which most scenarios reach by 2100.",
        q3: "Can we stop sea level rise?",
        a3: "We cannot stop it entirely, but we can significantly slow it. The difference between low and high emissions is about 0.3m by 2100 and several meters by 2500.",
        warning: "⚠ Projections beyond 2100 have lower confidence, especially for Antarctic ice sheet dynamics. Treat 2500 values as exploratory scenarios, not predictions.",
      };

  const cities: Array<[string, string, string, "critical" | "high"]> = [
    ["Jakarta, Indonesia · 雅加达", "10.6M", zh ? "~8m（地面沉降中）" : "~8m avg (sinking)", "critical"],
    ["Shanghai, China · 上海", "24.9M", "~4m", "critical"],
    ["Miami, USA · 迈阿密", "6.1M", "~2m", "critical"],
    ["Bangkok, Thailand · 曼谷", "10.7M", "~1.5m", "critical"],
    ["Mumbai, India · 孟买", "20.7M", "~14m", "high"],
    ["New York, USA · 纽约", "8.8M", "~10m", "high"],
    ["Osaka, Japan · 大阪", "19M", "~5m", "high"],
    ["Alexandria, Egypt · 亚历山大", "5.2M", "~5m", "critical"],
  ];

  return (
    <LearnLayout title={T.title}>
      <p style={learnStyle.p}>{T.p_intro}</p>

      <h2 style={learnStyle.h2}>{T.h2_proj}</h2>
      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>{T.th_scenario}</th>
            <th style={learnStyle.th}>{T.th_2050}</th>
            <th style={learnStyle.th}>{T.th_2100}</th>
            <th style={learnStyle.th}>{T.th_2150}</th>
            <th style={learnStyle.th}>{T.th_2500}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}><strong>SSP1-2.6</strong></td><td style={learnStyle.td}>0.18-0.23m</td><td style={learnStyle.td}>0.28-0.55m</td><td style={learnStyle.td}>0.37-0.86m</td><td style={learnStyle.td}>0.3-1.0m</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP2-4.5</strong></td><td style={learnStyle.td}>0.19-0.26m</td><td style={learnStyle.td}>0.32-0.62m</td><td style={learnStyle.td}>0.44-1.01m</td><td style={learnStyle.td}>0.5-1.8m</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP3-7.0</strong></td><td style={learnStyle.td}>0.20-0.27m</td><td style={learnStyle.td}>0.36-0.70m</td><td style={learnStyle.td}>0.49-1.11m</td><td style={learnStyle.td}>0.6-2.5m</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP5-8.5</strong></td><td style={learnStyle.td}>0.21-0.29m</td><td style={learnStyle.td}>0.44-0.76m</td><td style={learnStyle.td}>0.61-1.31m</td><td style={learnStyle.td}>1.0-4.5m</td></tr>
        </tbody>
      </table>
      <p style={learnStyle.source}>{T.source}</p>

      <h2 style={learnStyle.h2}>{T.h2_cause}</h2>
      <p style={learnStyle.p}>{T.p_cause}</p>
      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>{T.th_component}</th>
            <th style={learnStyle.th}>{T.th_share}</th>
            <th style={learnStyle.th}>{T.th_mech}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}><strong>{zh ? "海水热膨胀" : "Thermal expansion"}</strong></td><td style={learnStyle.td}>~40-50%</td><td style={learnStyle.td}>{T.c_thermal}</td></tr>
          <tr><td style={learnStyle.td}><strong>{zh ? "山地冰川" : "Mountain glaciers"}</strong></td><td style={learnStyle.td}>~20-25%</td><td style={learnStyle.td}>{T.c_glacier}</td></tr>
          <tr><td style={learnStyle.td}><strong>{zh ? "格陵兰冰盖" : "Greenland ice sheet"}</strong></td><td style={learnStyle.td}>~15-20%</td><td style={learnStyle.td}>{T.c_greenland}</td></tr>
          <tr><td style={learnStyle.td}><strong>{zh ? "南极冰盖" : "Antarctic ice sheet"}</strong></td><td style={learnStyle.td}>~10-15%</td><td style={learnStyle.td}>{T.c_antarctic}</td></tr>
          <tr><td style={learnStyle.td}><strong>{zh ? "陆地储水" : "Land water storage"}</strong></td><td style={learnStyle.td}>&lt;5%</td><td style={learnStyle.td}>{T.c_land}</td></tr>
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>{T.h2_cities}</h2>
      <p style={learnStyle.p}>{T.p_cities}</p>
      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>{T.th_city}</th>
            <th style={learnStyle.th}>{T.th_pop}</th>
            <th style={learnStyle.th}>{T.th_elev}</th>
            <th style={learnStyle.th}>{T.th_risk}</th>
          </tr>
        </thead>
        <tbody>
          {cities.map(([name, pop, elev, risk]) => (
            <tr key={name}>
              <td style={learnStyle.td}>{name}</td>
              <td style={learnStyle.td}>{pop}</td>
              <td style={learnStyle.td}>{elev}</td>
              <td style={learnStyle.td}>{risk === "critical" ? T.risk_critical : T.risk_high}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>{T.h2_locked}</h2>
      <p style={learnStyle.p}>{T.p_locked}</p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li>{T.li_inertia}</li>
        <li>{T.li_ice}</li>
        <li>{T.li_carbon}</li>
      </ul>

      <h2 style={learnStyle.h2}>{T.h2_see}</h2>
      <p style={learnStyle.p}>{T.p_see}</p>
      <a href={`/?scenario=ssp585&year=2100${zh ? "&lang=zh" : ""}`} style={learnStyle.cta}>{T.cta}</a>

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
