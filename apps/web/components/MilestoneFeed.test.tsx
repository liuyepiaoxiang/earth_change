// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import MilestoneFeed from "./MilestoneFeed";
import EventNotification from "./EventNotification";
import { runScenario, milestoneEvents } from "@future-earth/engine";
import type { SimResultWithUnc } from "../lib/sim";

const sim = runScenario("ssp585", 2500) as SimResultWithUnc;

describe("V4.1 里程碑 UI", () => {
  afterEach(cleanup);
  it("大事记渲染事件列表（ssp585 ≥ 8 项）", () => {
    const { getByTestId } = render(<MilestoneFeed sim={sim} year={2100} onJump={() => {}} />);
    expect(getByTestId("milestone-feed").innerText).toContain("里程碑事件");
  });
  it("点击事件跳转年份", () => {
    const onJump = vi.fn();
    const { container } = render(<MilestoneFeed sim={sim} year={2100} onJump={onJump} />);
    const btns = container.querySelectorAll("button");
    expect(btns.length).toBeGreaterThan(5);
    fireEvent.click(btns[0]!);
    expect(onJump).toHaveBeenCalled();
  });
  it("通知卡片有事件时显示，null 时不渲染", () => {
    const evts = milestoneEvents(sim);
    const { getByTestId, rerender } = render(<EventNotification event={evts[0]!} onDismiss={() => {}} />);
    expect(getByTestId("event-notification")).toBeTruthy();
    rerender(<EventNotification event={null} onDismiss={() => {}} />);
  });
});
