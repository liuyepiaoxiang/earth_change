import type { Metadata } from "next";
import LearnLayout from "../LearnLayout";
import { learnStyle } from "../styles";

export const metadata: Metadata = {
  title: "How Much Will Sea Levels Rise by 2100 and 2500? IPCC Projections",
  description: "Sea level rise projections by 2100: SSP1-2.6 = 0.4m, SSP5-8.5 = 0.8m. See which cities will be underwater with interactive visualization. IPCC AR6 data.",
  alternates: { canonical: "https://earth-change.vercel.app/learn/sea-level-rise" },
};

export default function SeaLevelRisePage() {
  return (
    <LearnLayout title="How Much Will Sea Levels Rise by 2100 and 2500?">
      <p style={learnStyle.p}>
        Global sea levels have already risen about <strong>0.20-0.25 meters since 1900</strong>, and the rate is accelerating. According to IPCC AR6, sea levels will continue rising for centuries regardless of emission reductions. The question is: how much?
      </p>

      <h2 style={learnStyle.h2}>Sea Level Rise Projections by Scenario</h2>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>Scenario</th>
            <th style={learnStyle.th}>By 2050</th>
            <th style={learnStyle.th}>By 2100</th>
            <th style={learnStyle.th}>By 2150</th>
            <th style={learnStyle.th}>By 2500</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}><strong>SSP1-2.6</strong></td><td style={learnStyle.td}>0.18-0.23m</td><td style={learnStyle.td}>0.28-0.55m</td><td style={learnStyle.td}>0.37-0.86m</td><td style={learnStyle.td}>0.3-1.0m</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP2-4.5</strong></td><td style={learnStyle.td}>0.19-0.26m</td><td style={learnStyle.td}>0.32-0.62m</td><td style={learnStyle.td}>0.44-1.01m</td><td style={learnStyle.td}>0.5-1.8m</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP3-7.0</strong></td><td style={learnStyle.td}>0.20-0.27m</td><td style={learnStyle.td}>0.36-0.70m</td><td style={learnStyle.td}>0.49-1.11m</td><td style={learnStyle.td}>0.6-2.5m</td></tr>
          <tr><td style={learnStyle.td}><strong>SSP5-8.5</strong></td><td style={learnStyle.td}>0.21-0.29m</td><td style={learnStyle.td}>0.44-0.76m</td><td style={learnStyle.td}>0.61-1.31m</td><td style={learnStyle.td}>1.0-4.5m</td></tr>
        </tbody>
      </table>
      <p style={learnStyle.source}>Source: IPCC AR6 WG1, Table 9.9 (2021). Values are likely ranges relative to 1995-2014 baseline.</p>

      <h2 style={learnStyle.h2}>What Causes Sea Level Rise?</h2>
      <p style={learnStyle.p}>
        Sea level rise comes from four main components, each contributing differently:
      </p>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>Component</th>
            <th style={learnStyle.th}>Share by 2100</th>
            <th style={learnStyle.th}>Mechanism</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}><strong>Thermal expansion</strong></td><td style={learnStyle.td}>~40-50%</td><td style={learnStyle.td}>Ocean water expands as it warms. The ocean has absorbed 90% of excess heat.</td></tr>
          <tr><td style={learnStyle.td}><strong>Mountain glaciers</strong></td><td style={learnStyle.td}>~20-25%</td><td style={learnStyle.td}>Glaciers melt and flow to the ocean.</td></tr>
          <tr><td style={learnStyle.td}><strong>Greenland ice sheet</strong></td><td style={learnStyle.td}>~15-20%</td><td style={learnStyle.td}>Surface melting and calving of glaciers.</td></tr>
          <tr><td style={learnStyle.td}><strong>Antarctic ice sheet</strong></td><td style={learnStyle.td}>~10-15%</td><td style={learnStyle.td}>Most uncertain. Potential for rapid collapse.</td></tr>
          <tr><td style={learnStyle.td}><strong>Land water storage</strong></td><td style={learnStyle.td}>&lt;5%</td><td style={learnStyle.td}>Reservoir storage vs groundwater extraction.</td></tr>
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>Which Cities Are Most at Risk?</h2>
      <p style={learnStyle.p}>
        Cities with low elevation and large populations face the greatest risk. By 2100 under medium-to-high emissions:
      </p>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>City</th>
            <th style={learnStyle.th}>Population</th>
            <th style={learnStyle.th}>Elevation</th>
            <th style={learnStyle.th}>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}>Jakarta, Indonesia</td><td style={learnStyle.td}>10.6M</td><td style={learnStyle.td}>~8m avg (sinking)</td><td style={learnStyle.td}>🔴 Critical</td></tr>
          <tr><td style={learnStyle.td}>Shanghai, China</td><td style={learnStyle.td}>24.9M</td><td style={learnStyle.td}>~4m</td><td style={learnStyle.td}>🔴 Critical</td></tr>
          <tr><td style={learnStyle.td}>Miami, USA</td><td style={learnStyle.td}>6.1M</td><td style={learnStyle.td}>~2m</td><td style={learnStyle.td}>🔴 Critical</td></tr>
          <tr><td style={learnStyle.td}>Bangkok, Thailand</td><td style={learnStyle.td}>10.7M</td><td style={learnStyle.td}>~1.5m</td><td style={learnStyle.td}>🔴 Critical</td></tr>
          <tr><td style={learnStyle.td}>Mumbai, India</td><td style={learnStyle.td}>20.7M</td><td style={learnStyle.td}>~14m</td><td style={learnStyle.td}>🟡 High</td></tr>
          <tr><td style={learnStyle.td}>New York, USA</td><td style={learnStyle.td}>8.8M</td><td style={learnStyle.td}>~10m</td><td style={learnStyle.td}>🟡 High</td></tr>
          <tr><td style={learnStyle.td}>Osaka, Japan</td><td style={learnStyle.td}>19M</td><td style={learnStyle.td}>~5m</td><td style={learnStyle.td}>🟡 High</td></tr>
          <tr><td style={learnStyle.td}>Alexandria, Egypt</td><td style={learnStyle.td}>5.2M</td><td style={learnStyle.td}>~5m</td><td style={learnStyle.td}>🔴 Critical</td></tr>
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>Why Is Sea Level Rise Locked In?</h2>
      <p style={learnStyle.p}>
        Even if we stopped all emissions today, sea levels would continue rising for centuries. This is because:
      </p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li><strong>Ocean heat inertia:</strong> The deep ocean takes centuries to warm; expansion continues</li>
        <li><strong>Ice sheet dynamics:</strong> Greenland and Antarctic ice sheets respond slowly but irreversibly to warming</li>
        <li><strong>Carbon lifetime:</strong> CO₂ stays in the atmosphere for 300-1000 years</li>
      </ul>

      <h2 style={learnStyle.h2}>See Sea Level Rise in Your City</h2>
      <p style={learnStyle.p}>
        Our interactive simulator shows exactly when each city crosses the flooding threshold under each emission scenario. Click any of 500 major cities on the 3D globe to see its specific timeline.
      </p>
      <a href="/?scenario=ssp585&year=2100" style={learnStyle.cta}>
        🌊 See Which Cities Will Flood →
      </a>

      <h2 style={learnStyle.h2}>Frequently Asked Questions</h2>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>How much has sea level risen since 1900?</h3>
      <p style={learnStyle.p}>About 0.20 meters (8 inches). The rate has accelerated from ~1.4 mm/year (1901-1990) to ~3.7 mm/year (2006-2018).</p>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>Will coastal cities be underwater by 2050?</h3>
      <p style={learnStyle.p}>Most major cities will not be fully underwater by 2050, but many low-lying areas will experience regular "nuisance flooding" during high tides and storms. The critical threshold is around 0.5m rise, which most scenarios reach by 2100.</p>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>Can we stop sea level rise?</h3>
      <p style={learnStyle.p}>We cannot stop it entirely, but we can significantly slow it. The difference between low and high emissions is about 0.3m by 2100 and several meters by 2500.</p>

      <div style={learnStyle.warning}>
        ⚠ Projections beyond 2100 have lower confidence, especially for Antarctic ice sheet dynamics. Treat 2500 values as exploratory scenarios, not predictions.
      </div>
    </LearnLayout>
  );
}
