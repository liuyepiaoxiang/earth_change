/** V0.3 温度阈值首超年份（1.5/2/3 °C）——引擎纯函数 */
export interface CrossingYears {
  t15?: number;
  t20?: number;
  t30?: number;
}

export function crossingYears(years: number[], tempAnomaly: number[]): CrossingYears {
  const first = (th: number): number | undefined => {
    for (let i = 0; i < years.length; i++) if (tempAnomaly[i]! >= th) return years[i]!;
    return undefined;
  };
  return { t15: first(1.5), t20: first(2), t30: first(3) };
}
