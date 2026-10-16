import type { Metadata } from "next";
import Dashboard from "../../components/Dashboard";

export const metadata: Metadata = { title: "未来地球引擎 · 嵌入视图" };

/** 嵌入模式：仅地球 + 时间轴 + 指标（无编辑器/导航） */
export default function Embed() {
  return <Dashboard embed />;
}
