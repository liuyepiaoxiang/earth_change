// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { afterEach } from "vitest";
import QuizIntro from "./QuizIntro";
import type { SimResultWithUnc } from "../lib/sim";

const sim = {
  scenario: "ssp585",
  years: [2050, 2100],
  metrics: { tempAnomaly: [1.5, 4.2], seaLevel: { total: [], thermal: [], glacier: [], iceSheet: [], landWater: [] }, co2: [] },
} as unknown as SimResultWithUnc;

afterEach(() => { cleanup(); localStorage.clear(); });

describe("A1 进站猜猜看弹层", () => {
  it("sim 就绪 + 首访 → 弹出 dialog；答题揭晓后写 localStorage 标记", () => {
    const { getByRole, getByText } = render(<QuizIntro sim={sim} year={2100} onClose={() => {}} onMore={() => {}} />);
    const dlg = getByRole("dialog");
    expect(dlg.getAttribute("aria-modal")).toBe("true");
    expect(getByText(/2100/)).toBeTruthy();
    fireEvent.click(getByText(/揭晓答案/));
    expect(localStorage.getItem("fe-quiz-intro-v1")).toBe("1");
    expect(getByText(/模型给出的 2100 年实际升温/)).toBeTruthy();
    expect(getByText(/\+4\.2°C/)).toBeTruthy();
  });

  it("已看过标记 → 不弹；sim 为 null（Worker 计算中）→ 不弹", () => {
    localStorage.setItem("fe-quiz-intro-v1", "1");
    const a = render(<QuizIntro sim={sim} year={2100} onClose={() => {}} onMore={() => {}} />);
    expect(a.queryByRole("dialog")).toBeNull();
    cleanup();
    const b = render(<QuizIntro sim={null} year={2100} onClose={() => {}} onMore={() => {}} />);
    expect(b.queryByRole("dialog")).toBeNull();
  });

  it("Escape 关闭并写标记；「再来一题」触发 onMore", () => {
    const onMore = vi.fn();
    const onClose = vi.fn();
    const { getByRole, getByText, container } = render(
      <QuizIntro sim={sim} year={2100} onClose={onClose} onMore={onMore} />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(getByRole || container).toBeTruthy(); // 关闭由 effect 异步完成
    // 重渲染后确认消失
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(localStorage.getItem("fe-quiz-intro-v1")).toBe("1");
    // 再开一局验证 onMore
    localStorage.clear();
    const b = render(<QuizIntro sim={sim} year={2100} onClose={onClose} onMore={onMore} />);
    fireEvent.click(b.getByText(/揭晓答案/));
    fireEvent.click(b.getByText(/再来一题/));
    expect(onMore).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });
});
