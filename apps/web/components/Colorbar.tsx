"use client";
import { tempColorCssGradient, TEMP_STOPS, TEMP_DOMAIN } from "../lib/colormap";
import { panelStyle, tokens } from "../lib/design";

const TICKS = [0, 1, 2, 4, 6, 8]; // 色标刻度（°C）——从色域端点与 stops 语义挑选
const [D_MIN, D_MAX] = TEMP_DOMAIN;

export default function Colorbar() {
  const tickPos = (v: number) => `${(((v - D_MIN) / (D_MAX - D_MIN)) * 100).toFixed(1)}%`;
  return (
    <div className="fe-fade-up" style={{ ...panelStyle, position: "absolute", left: 16, bottom: 16, width: 300, padding: "10px 12px", fontSize: 12 }}>
      <div style={{ color: tokens.textFaint, marginBottom: 6 }}>
        地表温度异常（°C，相对 1850 年工业化前基线）
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: tempColorCssGradient(),
          border: `1px solid ${tokens.panelBorder}`,
        }}
      />
      <div style={{ position: "relative", height: 14, marginTop: 2 }}>
        {TICKS.map((v) => (
          <span
            key={v}
            style={{
              position: "absolute",
              left: tickPos(v),
              transform: "translateX(-50%)",
              color: tokens.textMuted,
              fontSize: 10,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {v}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 6, fontSize: 11, color: tokens.textMuted }}>
        <span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#eab308", marginRight: 5 }} />
          城市（<span style={{ color: "#38bdf8" }}>青 = 已淹没</span>）
        </span>
        <span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#93c5fd", marginRight: 5 }} />
          海冰面积（M km²）
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: tokens.textDisabled, lineHeight: 1.5 }}>
        数据：NASA GISTEMP · WorldClim 2.1 · GeoNames · NOAA/AR6 锚点 ｜ 模型 v0.1.0（两层 EBM + 碳循环，G1–G5 定量验收）
      </div>
    </div>
  );
}
