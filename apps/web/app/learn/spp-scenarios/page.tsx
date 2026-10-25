import type { Metadata } from "next";
import LearnLayout from "../LearnLayout";
import { learnStyle } from "../styles";

export const metadata: Metadata = {
  title: "What Are SSP Scenarios? IPCC Shared Socioeconomic Pathways Explained",
  description: "SSP scenarios explained simply: SSP1-2.6, SSP2-4.5, SSP3-7.0, SSP5-8.5. How much will temperatures rise by 2100 under each pathway? Interactive visualization included.",
  alternates: { canonical: "https://earth-change.vercel.app/learn/ssp-scenarios" },
};

export default function SSPScenariosPage() {
  return (
    <LearnLayout title="What Are SSP Scenarios? IPCC Shared Socioeconomic Pathways Explained">
      <p style={learnStyle.p}>
        <strong>SSP stands for Shared Socioeconomic Pathway.</strong> These are standardized scenarios used by the IPCC (Intergovernmental Panel on Climate Change) to project how global temperatures, sea levels, and climate impacts will change under different levels of greenhouse gas emissions. There are five main SSP scenarios, each representing a different possible future for humanity.
      </p>

      <h2 style={learnStyle.h2}>The Four Main SSP Scenarios</h2>
      <p style={learnStyle.p}>
        Each SSP is named with two numbers: the first indicates the socioeconomic pathway (1-5), and the second indicates the radiative forcing level by 2100 (in watts per square meter).
      </p>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>Scenario</th>
            <th style={learnStyle.th}>Name</th>
            <th style={learnStyle.th}>2100 Warming</th>
            <th style={learnStyle.th}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={learnStyle.td}><strong>SSP1-2.6</strong></td>
            <td style={learnStyle.td}>Sustainability</td>
            <td style={learnStyle.td}>~1.8°C</td>
            <td style={learnStyle.td}>Low emissions. Rapid transition to clean energy, sustainable lifestyles. Consistent with Paris Agreement 1.5°C goal.</td>
          </tr>
          <tr>
            <td style={learnStyle.td}><strong>SSP2-4.5</strong></td>
            <td style={learnStyle.td}>Middle of the Road</td>
            <td style={learnStyle.td}>~2.7°C</td>
            <td style={learnStyle.td}>Intermediate emissions. Historical patterns continue with gradual improvements. Most commonly used baseline.</td>
          </tr>
          <tr>
            <td style={learnStyle.td}><strong>SSP3-7.0</strong></td>
            <td style={learnStyle.td}>Regional Rivalry</td>
            <td style={learnStyle.td}>~3.6°C</td>
            <td style={learnStyle.td}>Medium-high emissions. Resurgent nationalism, reduced international cooperation, energy security concerns.</td>
          </tr>
          <tr>
            <td style={learnStyle.td}><strong>SSP5-8.5</strong></td>
            <td style={learnStyle.td}>Fossil-fueled Development</td>
            <td style={learnStyle.td}>~4.4°C</td>
            <td style={learnStyle.td}>High emissions. Rapid economic growth powered by fossil fuels. Often used as "worst case" scenario.</td>
          </tr>
        </tbody>
      </table>

      <h2 style={learnStyle.h2}>What Do the Numbers Mean?</h2>
      <p style={learnStyle.p}>
        The number after the dash (e.g., 2.6, 4.5, 8.5) represents the <strong>radiative forcing</strong> in watts per square meter (W/m²) by the year 2100. Radiative forcing measures the imbalance between incoming solar energy and outgoing infrared energy caused by greenhouse gases.
      </p>
      <p style={learnStyle.p}>
        To put this in perspective:
      </p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li>Pre-industrial CO₂ level: ~280 ppm → 0 W/m² additional forcing</li>
        <li>Current (2024) CO₂ level: ~423 ppm → ~2.9 W/m²</li>
        <li>SSP1-2.6: CO₂ peaks at ~445 ppm → 2.6 W/m² by 2100</li>
        <li>SSP5-8.5: CO₂ reaches ~1,135 ppm → 8.5 W/m² by 2100</li>
      </ul>

      <h2 style={learnStyle.h2}>How Much Will Temperatures Rise Under Each Scenario?</h2>
      <p style={learnStyle.p}>
        According to IPCC AR6 (Sixth Assessment Report, 2021), the best estimates for global temperature rise above pre-industrial levels (1850-1900 baseline) are:
      </p>

      <table style={learnStyle.table}>
        <thead>
          <tr>
            <th style={learnStyle.th}>Scenario</th>
            <th style={learnStyle.th}>Best Estimate</th>
            <th style={learnStyle.th}>Likely Range</th>
            <th style={learnStyle.th}>CO₂ 2100</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={learnStyle.td}>SSP1-2.6</td><td style={learnStyle.td}>1.8°C</td><td style={learnStyle.td}>1.3 – 2.4°C</td><td style={learnStyle.td}>~445 ppm</td></tr>
          <tr><td style={learnStyle.td}>SSP2-4.5</td><td style={learnStyle.td}>2.7°C</td><td style={learnStyle.td}>2.1 – 3.5°C</td><td style={learnStyle.td}>~603 ppm</td></tr>
          <tr><td style={learnStyle.td}>SSP3-7.0</td><td style={learnStyle.td}>3.6°C</td><td style={learnStyle.td}>2.8 – 4.6°C</td><td style={learnStyle.td}>~867 ppm</td></tr>
          <tr><td style={learnStyle.td}>SSP5-8.5</td><td style={learnStyle.td}>4.4°C</td><td style={learnStyle.td}>3.3 – 5.7°C</td><td style={learnStyle.td}>~1,135 ppm</td></tr>
        </tbody>
      </table>
      <p style={learnStyle.source}>Source: IPCC AR6 WG1, Table SPM.1 (2021)</p>

      <h2 style={learnStyle.h2}>Why Do Scenarios Matter?</h2>
      <p style={learnStyle.p}>
        The difference between SSP1-2.6 and SSP5-8.5 is about <strong>2.6°C of warming</strong> by 2100. This translates to:
      </p>
      <ul style={{ ...learnStyle.p, paddingLeft: 24 }}>
        <li><strong>Sea level:</strong> 0.4m vs 0.8m rise by 2100 (and much more by 2500)</li>
        <li><strong>Arctic ice:</strong> Ice-free summers possible under all scenarios by 2050, but permanent under high emissions</li>
        <li><strong>Coral reefs:</strong> 70-90% decline at 1.5°C vs &gt;99% at 2°C</li>
        <li><strong>Extreme heat:</strong> Heatwave frequency doubles at 2°C vs 1.5°C</li>
      </ul>

      <h2 style={learnStyle.h2}>Interactive SSP Visualization</h2>
      <p style={learnStyle.p}>
        Our interactive climate simulator lets you drag a timeline from 2026 to 2500 and see exactly how temperature, sea level, and city flooding change under each SSP scenario. All projections are calibrated against IPCC AR6 data.
      </p>
      <a href="/?scenario=ssp245&year=2100" style={learnStyle.cta}>
        🌍 Try the Interactive SSP Simulator →
      </a>

      <h2 style={learnStyle.h2}>Frequently Asked Questions</h2>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>Which SSP scenario is most likely?</h3>
      <p style={learnStyle.p}>
        SSP2-4.5 is often used as a "middle of the road" baseline. However, current policies put us on track for approximately SSP2-4.5 to SSP3-7.0, with best estimates around 2.5-3°C warming by 2100.
      </p>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>Is SSP5-8.5 still plausible?</h3>
      <p style={learnStyle.p}>
        Some researchers argue SSP5-8.5 is increasingly unlikely due to renewable energy cost reductions and climate policies. However, it remains useful as a "worst case" for risk assessment and is still physically possible.
      </p>

      <h3 style={{ ...learnStyle.h2, fontSize: 16, color: "#e0f2fe" }}>What is the difference between RCP and SSP?</h3>
      <p style={learnStyle.p}>
        RCP (Representative Concentration Pathway) was used in IPCC AR5 and only described greenhouse gas concentrations. SSP adds socioeconomic narratives (how the world develops) that lead to those concentrations, making scenarios more internally consistent.
      </p>

      <div style={learnStyle.warning}>
        ⚠ Note: These projections extend beyond 2100 as exploratory scenarios. Confidence decreases for projections beyond 2100.
      </div>
    </LearnLayout>
  );
}
