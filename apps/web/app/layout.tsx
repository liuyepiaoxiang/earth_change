import type { Metadata } from "next";
export const metadata: Metadata = { title: "未来地球引擎", description: "5-500 年地球环境演化模拟器" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
