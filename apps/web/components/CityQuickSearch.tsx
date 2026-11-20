"use client";
/** A2 首屏城市搜索直达：输入城市名（500 城过滤 top6）→ 选中即开 F22 富卡片 + 球体飞过去 */
import { useState } from "react";
import type { CityRow } from "@future-earth/data";
import { useI18n } from "../lib/i18n";
import { tokens } from "../lib/design";

export default function CityQuickSearch({
  cities,
  onSelect,
}: {
  cities: CityRow[];
  onSelect: (c: CityRow) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? cities.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  return (
    <div style={{ position: "relative", zIndex: 60, flex: "1 1 220px", minWidth: 180, maxWidth: 320 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.cityPlaceholder")}
        aria-label={t("search.cityPlaceholder")}
        style={{ width: "100%", boxSizing: "border-box", padding: "5px 10px", fontSize: 13, borderRadius: tokens.radiusSm, border: `1px solid ${tokens.panelBorder}`, background: "rgba(7,11,20,0.6)", color: tokens.text, outline: "none" }}
      />
      {results.length > 0 && (
        <div
          style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 2, ...{} }}
        >
          <div style={{ background: "rgba(13,18,34,0.97)", border: `1px solid ${tokens.panelBorder}`, borderRadius: tokens.radiusSm, backdropFilter: "blur(8px)", boxShadow: tokens.shadow }}>
            {results.map((c) => (
              <button
                key={`${c.name}-${c.lat}`}
                onClick={() => { onSelect(c); setQuery(""); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 13, cursor: "pointer", background: "none", border: "none", color: tokens.text }}
              >
                {c.name} <span style={{ color: tokens.textFaint, fontSize: 11 }}>（{c.country}）</span>
                <span style={{ color: tokens.textDisabled, fontSize: 11, marginLeft: 6 }}>{c.elevation}m</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
