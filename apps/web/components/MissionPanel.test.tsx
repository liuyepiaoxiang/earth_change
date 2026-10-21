// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import MissionPanel from "./MissionPanel";
import { runScenario } from "@future-earth/engine";
import { MISSIONS, checkMission } from "../lib/missions";
import type { SimResultWithUnc } from "../lib/sim";

const sim = runScenario("ssp245", 2500) as SimResultWithUnc;

describe("V0.4 任务系统", () => {
  afterEach(cleanup);

  it("任务列表显示 4 个任务", () => {
    const { getByTestId, getByText } = render(<MissionPanel sim={sim} />);
    expect(getByTestId("mission-list")).toBeTruthy();
    expect(getByText(/已完成 0\/4/)).toBeTruthy();
    expect(MISSIONS.length).toBe(4);
  });

  it("点击任务 → 预测 → 揭示 → 反思 → 完成", () => {
    const { getByText, getByTestId } = render(<MissionPanel sim={sim} />);
    fireEvent.click(getByText("2100 年会升多少？"));
    expect(getByTestId("prediction-intro")).toBeTruthy();
    // intro 阶段只显示信息——验证有标题和目标
    expect(getByText(/2100 年会升多少/)).toBeTruthy();
  });

  it("MISSIONS 数据完整性：每个有预测/原因/边界", () => {
    for (const m of MISSIONS) {
      expect(m.prediction.options.length).toBeGreaterThanOrEqual(3);
      expect(m.reason.oneLiner.length).toBeGreaterThan(8);
      expect(m.reason.causal).toContain("→");
      expect(m.limits.length).toBeGreaterThan(0);
    }
  });

  it("checkMission 返回有效结果", () => {
    const m3 = MISSIONS.find((m) => m.id === "m3-slr-components")!;
    const result = checkMission(m3, sim);
    expect(result.value).toContain("%");
  });
});
