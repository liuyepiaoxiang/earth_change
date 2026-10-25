import type { Metadata } from "next";
import LearnLayout from "../LearnLayout";
import { learnStyle } from "../styles";

export const metadata: Metadata = {
  title: "Which Cities Will Be Underwater by 2050, 2100, and 2500?",
  description: "Interactive map of cities at risk from sea level rise. See if Shanghai, Miami, Jakarta, Bangkok, Mumbai and 500+ cities will flood under different climate scenarios.",
  alternates: { canonical: "https://earth-change.vercel.app/learn/cities-underwater" },
};

export default function CitiesUnderwaterPage() {
  return (
    <LearnLayout title="Which Cities Will Be Underwater by 2050, 2100, and 2500?">
      <p style={learnStyle.p}>
        Sea level rise threatens <strong>over 500 major coastal cities</strong> worldwide. By 2100, between 200-600 million people could live in areas that experience annual flooding. Here&apos;s what the science says about which cities are most at risk, and when.
      </p>

      <h2 style={learnStyle.h2}>Cities at Greatest Risk by 2100</h2>
      <p style={learnStyle.p}>
        The cities below have the largest populations living within 10 meters above current sea level, combined with low elevation and limited natural protection.
      </p>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>City</th>
            <th style={learnStyle.th}>Country</th>
            <th style={learnStyle.th}>Population</th>
            <th style={learnStyle.th}>Avg Elevation</th>
            <th style={learnStyle.th}>Flooding Risk</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}><strong>Jakarta</strong></td><td style={learnStyle.td}>Indonesia</td><td style={learnStyle.td}>10.6M</td><td style={learnStyle.td}>~8m</td><td style={learnStyle.td}>🔴 Already flooding (also sinking 25cm/yr)</td></tr>
          <tr><td style={learnStyle.td}><strong>Bangkok</strong></td><td style={learnStyle.td}>Thailand</td><td style={learnStyle.td}>10.7M</td><td style={learnStyle.td}>~1.5m</td><td style={learnStyle.td}>🔴 Critical by 2050</td></tr>
          <tr><td style={learnStyle.td}><strong>Miami</strong></td><td style={learnStyle.td}>USA</td><td style={learnStyle.td}>6.1M</td><td style={learnStyle.td}>~2m</td><td style={learnStyle.td}>🔴 Critical by 2050 (limestone = can&apos;t build sea walls)</td></tr>
          <tr><td style={learnStyle.td}><strong>Shanghai</strong></td><td style={learnStyle.td}>China</td><td style={learnStyle.td}>24.9M</td><td style={learnStyle.td}>~4m</td><td style={learnStyle.td}>🟡 High by 2100</td></tr>
          <tr><td style={learnStyle.td}><strong>Manila</strong></td><td style={learnStyle.td}>Philippines</td><td style={learnStyle.td}>13.9M</td><td style={learnStyle.td}>~5m</td><td style={learnStyle.td}>🔴 Critical by 2100</td></tr>
          <tr><td style={learnStyle.td}><strong>Alexandria</strong></td><td style={learnStyle.td}>Egypt</td><td style={learnStyle.td}>5.2M</td><td style={learnStyle.td}>~5m</td><td style={learnStyle.td}>🔴 Critical by 2100</td></tr>
          <tr><td style={learnStyle.td}><strong>Osaka</strong></td><td style={learnStyle.td}>Japan</td><td style={learnStyle.td}>19M</td><td style={learnStyle.td}>~5m</td><td style={learnStyle.td}>🟡 High by 2100</td></tr>
          <tr><td style={learnStyle.td}><strong>Dhaka</strong></td><td style={learnStyle.td}>Bangladesh</td><td style={learnStyle.td}>22M</td><td style={learnStyle.td}>~6m</td><td style={learnStyle.td}>🟡 High by 2100</td></tr>
          <tr><td style={learnStyle.td}><strong>Lagos</strong></td><td style={learnStyle.td}>Nigeria</td><td style={learnStyle.td}>15.4M</td><td style={learnStyle.td}>~6m</td><td style={learnStyle.td}>🟡 High by 2100</td></tr>
          <tr><td style={learnStyle.td}><strong>Houston</strong></td><td style={learnStyle.td}>USA</td><td style={learnStyle.td}>7.1M</td><td style={learnStyle.td}>~15m</td><td style={learnStyle.td}>🟢 Moderate (sinking + hurricanes)</td></tr>
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>Timeline: When Do Cities Cross the Threshold?</h2>
      <p style={learnStyle.p}>
        Each city&apos;s flooding timeline depends on its elevation and the emission scenario. Here&apos;s an approximate timeline for major cities:
      </p>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>City</th>
            <th style={learnStyle.th}>Low Emissions (SSP1-2.6)</th>
            <th style={learnStyle.th}>Medium (SSP2-4.5)</th>
            <th style={learnStyle.th}>High (SSP5-8.5)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}>Bangkok (1.5m)</td><td style={learnStyle.td}>~2150</td><td style={learnStyle.td}>~2120</td><td style={learnStyle.td}>~2095</td></tr>
          <tr><td style={learnStyle.td}>Miami (2m)</td><td style={learnStyle.td}>~2200</td><td style={learnStyle.td}>~2130</td><td style={learnStyle.td}>~2100</td></tr>
          <tr><td style={learnStyle.td}>Alexandria (5m)</td><td style={learnStyle.td}>&gt;2500</td><td style={learnStyle.td}>~2350</td><td style={learnStyle.td}>~2250</td></tr>
          <tr><td style={learnStyle.td}>Shanghai (4m)</td><td style={learnStyle.td}>&gt;2500</td><td style={learnStyle.td}>~2400</td><td style={learnStyle.td}>~2280</td></tr>
        </tbody>
      </table>
      <p style={learnStyle.source}>Note: These are approximate thresholds for permanent inundation of average city elevation. Actual flooding will occur earlier during storms and high tides.</p>

      <h2 style={learnStyle.h2}>Factors That Make a City Vulnerable</h2>
      <p style={learnStyle.p}>
        Sea level rise doesn&apos;t affect all coastal cities equally. Key vulnerability factors include:
      </p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li><strong>Elevation:</strong> Lower cities flood first (obviously)</li>
        <li><strong>Land subsidence:</strong> Jakarta is sinking 25cm/year due to groundwater extraction—faster than sea level rise</li>
        <li><strong>Geology:</strong> Miami sits on porous limestone—sea walls can&apos;t prevent flooding because water comes through the rock</li>
        <li><strong>Storm exposure:</strong> Cities in hurricane/typhoon zones face compound flooding</li>
        <li><strong>Adaptation:</strong> Netherlands has 1/3 land below sea level but advanced protection systems</li>
      </ul>

      <h2 style={learnStyle.h2}>Check Your City</h2>
      <p style={learnStyle.p}>
        Our interactive simulator tracks 500 major cities worldwide. Click any city on the 3D globe to see:
      </p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li>Its exact elevation above sea level</li>
        <li>Local warming projection (including Arctic amplification)</li>
        <li>Precipitation changes</li>
        <li>Biome shift (what vegetation zone it transitions to)</li>
        <li>When it crosses the flooding threshold under each scenario</li>
      </ul>
      <a href="/?scenario=ssp245&year=2100" style={learnStyle.cta}>
        🏙️ Check Your City&apos;s Climate Future →
      </a>

      <h2 style={learnStyle.h2}>Frequently Asked Questions</h2>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>Will Shanghai be underwater by 2100?</h3>
      <p style={learnStyle.p}>
        Shanghai&apos;s average elevation is about 4m above sea level. Under SSP2-4.5, sea level rise by 2100 is about 0.3-0.6m. Full inundation wouldn&apos;t occur until sea levels reach 4m (unlikely before 2300). However, low-lying coastal districts and the Bund area could face regular flooding by 2100.
      </p>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>Is Miami really going to be underwater?</h3>
      <p style={learnStyle.p}>
        Miami&apos;s situation is uniquely challenging because it sits on porous limestone. Even with sea walls, water will seep up through the ground. By 2040-2060, many low-lying neighborhoods are expected to face regular tidal flooding. By 2100, significant portions could be uninhabitable.
      </p>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>Which country will be most affected?</h3>
      <p style={learnStyle.p}>
        Bangladesh, Vietnam, and small island nations (Maldives, Tuvalu, Marshall Islands) face existential threats. Bangladesh alone has over 30 million people living within 5m of sea level.
      </p>

      <div style={learnStyle.warning}>
        ⚠ These projections are educational estimates based on simplified models. For city-specific flood risk assessments, consult local engineering studies that account for subsidence, coastal defenses, and storm surge.
      </div>
    </LearnLayout>
  );
}
