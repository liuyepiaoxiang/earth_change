import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadCities } from "@future-earth/data";
import type { CityRow } from "@future-earth/data";

export const dynamicParams = true;

// Generate static params for top 50 cities
export function generateStaticParams(): Array<{ slug: string }> {
  const cities = loadCities();
  return cities.slice(0, 50).map((c: CityRow) => ({
    slug: c.name.toLowerCase().replace(/\s+/g, "-"),
  }));
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function findCity(slug: string): CityRow | null {
  const cities = loadCities();
  return cities.find((c: CityRow) => slugify(c.name) === slug) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const city = findCity(params.slug);
  if (!city) return { title: "City Not Found" };
  return {
    title: `${city.name} Climate Change: Will It Be Underwater by 2100?`,
    description: `${city.name} (${city.country}) climate projections: sea level rise impact, temperature increase, and flooding risk by 2050, 2100, and 2500. Elevation: ${city.elevation}m. Interactive visualization.`,
    alternates: { canonical: `https://earth-change.vercel.app/city/${params.slug}` },
  };
}

export default function CityPage({ params }: { params: { slug: string } }) {
  const city = findCity(params.slug);
  if (!city) notFound();

  const isLowElevation = city.elevation < 10;
  const riskLevel = city.elevation < 2 ? "Critical" : city.elevation < 5 ? "High" : city.elevation < 20 ? "Moderate" : "Low";
  const riskColor = riskLevel === "Critical" ? "#f87171" : riskLevel === "High" ? "#fbbf24" : riskLevel === "Moderate" ? "#94a3b8" : "#4ade80";
  const popM = (city.population / 1_000_000).toFixed(1);

  return (
    <main style={{ minHeight: "100vh", background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #1e293b" }}>
        <Link href="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: 14 }}>🌍 未来地球引擎</Link>
        <span style={{ color: "#475569", margin: "0 8px" }}>|</span>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>城市气候报告</span>
      </header>

      <article style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 26, color: "#e0f2fe", marginBottom: 4 }}>{city.name} Climate Change Report</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          {city.name}, {city.country} · Population {popM}M · Elevation {city.elevation}m
        </p>

        <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: `1px solid ${riskColor}44`, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Flooding Risk Level</div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: riskColor }}>{riskLevel}</div>
          <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
            {isLowElevation
              ? `${city.name} is highly vulnerable to sea level rise. At ${city.elevation}m elevation, the city faces significant flooding risk as global sea levels continue to rise through 2100 and beyond.`
              : `${city.name} sits at ${city.elevation}m elevation, providing relatively better protection against sea level rise compared to low-lying coastal cities. However, climate change will still bring increased temperatures and changing precipitation patterns.`}
          </p>
        </div>

        <h2 style={{ fontSize: 18, color: "#7dd3fc", marginTop: 28, marginBottom: 10 }}>Key Data</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>Elevation</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#e0f2fe", textAlign: "right" }}>{city.elevation} m above sea level</td></tr>
            <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>Population</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#e0f2fe", textAlign: "right" }}>{popM} million</td></tr>
            <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>Coordinates</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#e0f2fe", textAlign: "right" }}>{city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°</td></tr>
            <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>Current annual mean temp</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#e0f2fe", textAlign: "right" }}>{city.tbase.toFixed(1)}°C</td></tr>
            <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>Current annual precipitation</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#e0f2fe", textAlign: "right" }}>{city.pbase.toFixed(0)} mm/yr</td></tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: 18, color: "#7dd3fc", marginTop: 28, marginBottom: 10 }}>What the Future Holds</h2>
        <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.7 }}>
          Under the intermediate scenario (SSP2-4.5), global temperatures are projected to rise approximately 2.7°C by 2100.
          For {city.name}, this means local temperature increases amplified by latitude and land-sea factors, changing precipitation patterns,
          and {isLowElevation ? "significant risk of permanent coastal flooding" : "moderate climate stress"}.
        </p>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
          Source: IPCC AR6 sea level projections, NASA GISTEMP baseline data, GeoNames elevation data
        </p>

        <h2 style={{ fontSize: 18, color: "#7dd3fc", marginTop: 28, marginBottom: 10 }}>See {city.name} on the Interactive Globe</h2>
        <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.7 }}>
          Click {city.name} on our 3D globe to see its exact flooding timeline, local warming projection, and biome shift through 2500.
          Compare all four SSP scenarios side by side.
        </p>
        <Link
          href={`/?scenario=ssp245&year=2100`}
          style={{ display: "block", margin: "24px auto", padding: "14px 32px", textAlign: "center", background: "#0c4a6e", color: "#e0f2fe", borderRadius: 12, textDecoration: "none", fontSize: 15, fontWeight: "bold", border: "1px solid #38bdf8" }}
        >
          🌍 Open {city.name} on Interactive Globe →
        </Link>

        <h2 style={{ fontSize: 18, color: "#7dd3fc", marginTop: 28, marginBottom: 10 }}>Other Cities at Risk</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {[
            { name: "Shanghai", slug: "shanghai" }, { name: "Miami", slug: "miami" },
            { name: "Bangkok", slug: "bangkok" }, { name: "Jakarta", slug: "jakarta" },
            { name: "Manila", slug: "manila" }, { name: "Alexandria", slug: "alexandria" },
            { name: "Osaka", slug: "osaka" }, { name: "Mumbai", slug: "mumbai" },
          ].filter(c => c.slug !== params.slug).map(c => (
            <Link key={c.slug} href={`/city/${c.slug}`} style={{ padding: "6px 14px", background: "#0f172a", color: "#94a3b8", borderRadius: 8, textDecoration: "none", fontSize: 13, border: "1px solid #334155" }}>
              {c.name}
            </Link>
          ))}
        </div>
      </article>
    </main>
  );
}
