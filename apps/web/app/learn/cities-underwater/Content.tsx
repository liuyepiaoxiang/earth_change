"use client";
import LearnLayout from "../LearnLayout";
import { learnStyle } from "../styles";
import { useI18n } from "../../../lib/i18n";

/** 城市淹没风险讲解——双语内容（默认 SSR 英文，利于英文 SEO） */
export default function Content() {
  const { locale } = useI18n();
  const zh = locale === "zh";
  const T = zh
    ? {
        title: "哪些城市会在 2050 / 2100 / 2500 年被淹没？",
        p_intro: <>海平面上升威胁着全球 <strong>500 多个主要沿海城市</strong>。到 2100 年，2–6 亿人可能生活在每年都遭遇洪水的区域。以下是关于「哪些城市风险最大、何时被淹」的科学结论。</>,
        h2_risk: "2100 年前风险最大的城市",
        p_risk: "下列城市居住在海拔 10 米以下的人口最多，且地势低洼、缺乏天然屏障。",
        th_city: "城市", th_country: "国家", th_pop: "人口", th_elev: "平均高程", th_risk: "淹没风险",
        h2_timeline: "时间线：城市何时跨过阈值？",
        p_timeline: "每个城市的淹没时间取决于它的海拔与排放情景。主要城市的大致时间线：",
        th_low: "低排放（SSP1-2.6）", th_mid: "中等（SSP2-4.5）", th_high: "高排放（SSP5-8.5）",
        source: "注：以上为城市平均海拔被永久淹没的大致阈值。风暴与高潮位导致的实际洪水会更早出现。",
        h2_factors: "什么让一座城市脆弱？",
        p_factors: "海平面上升对各沿海城市的影响并不均等，关键脆弱性因素包括：",
        li_elev: "海拔：越低的城市越先被淹",
        li_subsidence: "地面沉降：雅加达因地下水超采每年下沉 25 厘米——比海平面上升还快",
        li_geology: "地质：迈阿密建在多孔石灰岩上——海水会从岩层渗出，海堤挡不住",
        li_storm: "风暴暴露：台风/飓风带的城市面临复合洪水",
        li_adapt: "适应能力：荷兰 1/3 国土低于海平面，但有先进的防护体系",
        h2_check: "查询你的城市",
        p_check: "互动模拟器覆盖全球 500 个主要城市。在 3D 地球上点击任意城市，可以看到：",
        li_c1: "城市的精确海拔",
        li_c2: "本地升温预测（含极地放大效应）",
        li_c3: "降水变化",
        li_c4: "群系迁移（植被带将变成什么）",
        li_c5: "各情景下何时跨过淹没阈值",
        cta: "🏙️ 查看你城市的气候未来 →",
        h2_faq: "常见问题",
        q1: "上海 2100 年会被淹没吗？",
        a1: "上海平均海拔约 4 米。SSP2-4.5 下 2100 年海平面上升约 0.3–0.6 米，完全淹没需海平面达到 4 米（2300 年前不太可能）。但低洼沿海城区和外滩一带到 2100 年可能面临常态化洪水。",
        q2: "迈阿密真的会被淹吗？",
        a2: "迈阿密的处境格外严峻：它坐落在多孔石灰岩上，即使修了海堤，海水也会从地下渗上来。预计 2040–2060 年许多低洼街区将面临常态化潮汐洪水，2100 年相当一部分城区可能不再宜居。",
        q3: "哪个国家受影响最大？",
        a3: "孟加拉国、越南以及小岛国（马尔代夫、图瓦卢、马绍尔群岛）面临生存威胁。仅孟加拉国就有超过 3000 万人生活在海拔 5 米以下。",
        warning: "⚠ 以上预测是基于简化模型的教育性估计。城市级洪水风险评估请参考计入地面沉降、海岸防护与风暴潮的当地工程研究。",
      }
    : {
        title: "Which Cities Will Be Underwater by 2050, 2100, and 2500?",
        p_intro: <>Sea level rise threatens <strong>over 500 major coastal cities</strong> worldwide. By 2100, between 200-600 million people could live in areas that experience annual flooding. Here&apos;s what the science says about which cities are most at risk, and when.</>,
        h2_risk: "Cities at Greatest Risk by 2100",
        p_risk: "The cities below have the largest populations living within 10 meters above current sea level, combined with low elevation and limited natural protection.",
        th_city: "City", th_country: "Country", th_pop: "Population", th_elev: "Avg Elevation", th_risk: "Flooding Risk",
        h2_timeline: "Timeline: When Do Cities Cross the Threshold?",
        p_timeline: "Each city's flooding timeline depends on its elevation and the emission scenario. Here's an approximate timeline for major cities:",
        th_low: "Low Emissions (SSP1-2.6)", th_mid: "Medium (SSP2-4.5)", th_high: "High (SSP5-8.5)",
        source: "Note: These are approximate thresholds for permanent inundation of average city elevation. Actual flooding will occur earlier during storms and high tides.",
        h2_factors: "Factors That Make a City Vulnerable",
        p_factors: "Sea level rise doesn't affect all coastal cities equally. Key vulnerability factors include:",
        li_elev: "Elevation: lower cities flood first (obviously)",
        li_subsidence: "Land subsidence: Jakarta is sinking 25cm/year due to groundwater extraction—faster than sea level rise",
        li_geology: "Geology: Miami sits on porous limestone—sea walls can't prevent flooding because water comes through the rock",
        li_storm: "Storm exposure: cities in hurricane/typhoon zones face compound flooding",
        li_adapt: "Adaptation: the Netherlands has 1/3 of land below sea level but advanced protection systems",
        h2_check: "Check Your City",
        p_check: "Our interactive simulator tracks 500 major cities worldwide. Click any city on the 3D globe to see:",
        li_c1: "Its exact elevation above sea level",
        li_c2: "Local warming projection (including Arctic amplification)",
        li_c3: "Precipitation changes",
        li_c4: "Biome shift (what vegetation zone it transitions to)",
        li_c5: "When it crosses the flooding threshold under each scenario",
        cta: "🏙️ Check Your City's Climate Future →",
        h2_faq: "Frequently Asked Questions",
        q1: "Will Shanghai be underwater by 2100?",
        a1: "Shanghai's average elevation is about 4m above sea level. Under SSP2-4.5, sea level rise by 2100 is about 0.3-0.6m. Full inundation wouldn't occur until sea levels reach 4m (unlikely before 2300). However, low-lying coastal districts and the Bund area could face regular flooding by 2100.",
        q2: "Is Miami really going to be underwater?",
        a2: "Miami's situation is uniquely challenging because it sits on porous limestone. Even with sea walls, water will seep up through the ground. By 2040-2060, many low-lying neighborhoods are expected to face regular tidal flooding. By 2100, significant portions could be uninhabitable.",
        q3: "Which country will be most affected?",
        a3: "Bangladesh, Vietnam, and small island nations (Maldives, Tuvalu, Marshall Islands) face existential threats. Bangladesh alone has over 30 million people living within 5m of sea level.",
        warning: "⚠ These projections are educational estimates based on simplified models. For city-specific flood risk assessments, consult local engineering studies that account for subsidence, coastal defenses, and storm surge.",
      };

  const riskRows: Array<[string, string, string, string, string]> = [
    ["Jakarta · 雅加达", "Indonesia · 印尼", "10.6M", "~8m", zh ? "🔴 已在洪涝中（同时每年沉降 25cm）" : "🔴 Already flooding (also sinking 25cm/yr)"],
    ["Bangkok · 曼谷", "Thailand · 泰国", "10.7M", "~1.5m", zh ? "🔴 2050 年前极危" : "🔴 Critical by 2050"],
    ["Miami · 迈阿密", "USA · 美国", "6.1M", "~2m", zh ? "🔴 2050 年前极危（石灰岩地质，无法建海堤）" : "🔴 Critical by 2050 (limestone = can't build sea walls)"],
    ["Shanghai · 上海", "China · 中国", "24.9M", "~4m", zh ? "🟡 2100 年高风险" : "🟡 High by 2100"],
    ["Manila · 马尼拉", "Philippines · 菲律宾", "13.9M", "~5m", zh ? "🔴 2100 年前极危" : "🔴 Critical by 2100"],
    ["Alexandria · 亚历山大", "Egypt · 埃及", "5.2M", "~5m", zh ? "🔴 2100 年前极危" : "🔴 Critical by 2100"],
    ["Osaka · 大阪", "Japan · 日本", "19M", "~5m", zh ? "🟡 2100 年高风险" : "🟡 High by 2100"],
    ["Dhaka · 达卡", "Bangladesh · 孟加拉国", "22M", "~6m", zh ? "🟡 2100 年高风险" : "🟡 High by 2100"],
    ["Lagos · 拉各斯", "Nigeria · 尼日利亚", "15.4M", "~6m", zh ? "🟡 2100 年高风险" : "🟡 High by 2100"],
    ["Houston · 休斯顿", "USA · 美国", "7.1M", "~15m", zh ? "🟢 中等（沉降 + 飓风）" : "🟢 Moderate (sinking + hurricanes)"],
  ];
  const timelineRows: Array<[string, string, string, string]> = [
    ["Bangkok (1.5m)", "~2150", "~2120", "~2095"],
    ["Miami (2m)", "~2200", "~2130", "~2100"],
    ["Alexandria (5m)", ">2500", "~2350", "~2250"],
    ["Shanghai (4m)", ">2500", "~2400", "~2280"],
  ];

  return (
    <LearnLayout title={T.title}>
      <p style={learnStyle.p}>{T.p_intro}</p>

      <h2 style={learnStyle.h2}>{T.h2_risk}</h2>
      <p style={learnStyle.p}>{T.p_risk}</p>
      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>{T.th_city}</th>
            <th style={learnStyle.th}>{T.th_country}</th>
            <th style={learnStyle.th}>{T.th_pop}</th>
            <th style={learnStyle.th}>{T.th_elev}</th>
            <th style={learnStyle.th}>{T.th_risk}</th>
          </tr>
        </thead>
        <tbody>
          {riskRows.map(([city, country, pop, elev, risk]) => (
            <tr key={city}>
              <td style={learnStyle.td}><strong>{city.split(" · ")[0]}</strong></td>
              <td style={learnStyle.td}>{country}</td>
              <td style={learnStyle.td}>{pop}</td>
              <td style={learnStyle.td}>{elev}</td>
              <td style={learnStyle.td}>{risk}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>{T.h2_timeline}</h2>
      <p style={learnStyle.p}>{T.p_timeline}</p>
      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>{T.th_city}</th>
            <th style={learnStyle.th}>{T.th_low}</th>
            <th style={learnStyle.th}>{T.th_mid}</th>
            <th style={learnStyle.th}>{T.th_high}</th>
          </tr>
        </thead>
        <tbody>
          {timelineRows.map(([city, low, mid, high]) => (
            <tr key={city}>
              <td style={learnStyle.td}>{city}</td>
              <td style={learnStyle.td}>{low}</td>
              <td style={learnStyle.td}>{mid}</td>
              <td style={learnStyle.td}>{high}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={learnStyle.source}>{T.source}</p>

      <h2 style={learnStyle.h2}>{T.h2_factors}</h2>
      <p style={learnStyle.p}>{T.p_factors}</p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li>{T.li_elev}</li>
        <li>{T.li_subsidence}</li>
        <li>{T.li_geology}</li>
        <li>{T.li_storm}</li>
        <li>{T.li_adapt}</li>
      </ul>

      <h2 style={learnStyle.h2}>{T.h2_check}</h2>
      <p style={learnStyle.p}>{T.p_check}</p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li>{T.li_c1}</li>
        <li>{T.li_c2}</li>
        <li>{T.li_c3}</li>
        <li>{T.li_c4}</li>
        <li>{T.li_c5}</li>
      </ul>
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
