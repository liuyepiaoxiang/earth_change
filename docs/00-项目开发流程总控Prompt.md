# 00-项目开发流程总控（未来地球引擎）

> 派生自：`saas-starter/docs/15-可复用项目开发流程总控Prompt.md`（v1.x，通用工程流程协议）
> 派生日期：2026-10-11 ｜ 适用范围：仅本项目（earth_change monorepo）
> 关系声明：母文档定义通用流程原则；本档定义本项目具体执行规则。冲突时以源码真实能力为准并在问题记录中登记。

## 1. 项目变量

| 变量 | 值 |
|---|---|
| 项目名称 | 未来地球引擎（future-earth-engine） |
| 业务目标 | 5–500 年地球环境演化模拟器：排放情景 → 温度/海平面/冰冻圈耦合演化 → 3D 地球 + 时间轴呈现 |
| 当前技术栈 | TypeScript / pnpm monorepo / Next.js 14（Vercel 部署）/ vitest / react-globe.gl |
| 目标用户 | 公开匿名访客（只读），无登录体系 |
| 核心业务闭环 | 选情景 → 模拟（毫秒级）→ 拖时间轴 → 观察温度/海平面/淹没 → 点查城市 |
| 已有资料 | `docs/superpowers/specs/…design.md`（权威规格）、`docs/superpowers/plans/…core|web.md`（计划 A/B）、`AGENTS.md` |
| 输出位置 | `docs/00…07-*.md`（本目录） |

## 2. 与母文档的阶段适配

母文档 9 个阶段中，两个阶段因项目形态不同做了替换，其余照用：

| 母文档阶段 | 本项目适配 | 理由 |
|---|---|---|
| D 数据表建模 SQL | **数据资产与 manifest 治理**（`packages/data/datasets/` + sha256 manifest + gen-bundle 固化） | 无数据库；数据静态打包，等价物是 manifest 校验和门禁 |
| E 菜单权限初始化 | **规格一致性门禁**（zod schema + gen:spec 生成类型 + registry 一致性测试） | 无菜单权限体系；防漂移等价物是「YAML 唯一事实源 + 一致性测试」 |
| A 资产盘点 / B 需求 / C 任务 / F 功能细节 / G 测试矩阵 / H 环境手册 / I 准入复核 | 照用，产出 `docs/01–07` | — |

## 3. 项目总控 Prompt（已填变量，可直接使用）

```text
你同时是首席架构师、全栈负责人、QA 架师与流程治理者。基于本仓库源码与文档，为【未来地球引擎】
执行「需求 → 功能 → 流程 → 数据 → 测试 → 开发 → 验收」的可控开发流程。

工作原则（在母文档 12 条之上追加项目特有约束）：
1. 规格即数据：改方程先改 packages/spec/src/spec/*.yaml → pnpm gen:spec → 实现 → 注册 → 补测试；
   一致性测试强制，不允许只改一边。
2. 引擎纯 TS：packages/engine 禁止依赖 Next.js / 浏览器 API / node 内置模块 / 随机数（逐位确定性）。
3. 数据管道顺序：改任何 datasets/ 文件后必须重跑 gen-bundle.mjs（loaders 读生成模块不读磁盘）。
4. golden.test.ts（G1–G5）是验收门禁：失败回到参数先验调整，禁止放宽阈值。
5. 前端只测纯函数（vitest）；浏览器行为用手工冒烟清单（05 文档 §5）验证；E2E 属 v1。
6. LF 行尾（.gitattributes）；CSV 无引号 UTF-8；manifest sha256 与文件不符即测试失败。
7. v0 非目标（SPEC §11）勿顺手实现：2D 网格、蒙特卡洛、海冰动态、区域降水、在线抓取管道。
8. 每个任务一个 commit（Conventional Commit，中文主题）；提交前跑 pnpm test + pnpm --filter web build。
9. 文档语言中文、代码标识符英文。
```

## 4. 项目特有规则

| 规则 | 说明 |
|---|---|
| 分支约定 | 单人项目，**允许 main 直接提交**，条件：每次提交 = 一个最小任务单元 + 相关测试通过 + 可独立回滚。多人协作或高风险变更（改校准/规格）时必须开 `feature/<topic>` 分支 |
| 测试先行 | 新功能先写功能卡（04 文档）+ 至少 1 条测试映射，再编码；修 bug 先补一条能复现的测试 |
| 数据治理 | `datasets/` 下每个文件必须有 manifest 条目（utf8 口径 sha256，与 manifest.test.ts 一致）；web/public 下由 sync-public.mjs 同步的产物不入库 |
| 文档回填 | 实现偏离计划/规格时，当场回填对应文档的「偏差」段，不攒批 |

## 5. 项目问题记录

| 编号 | 日期 | 发现阶段 | 问题 | 根因 | 处理 | 状态 |
|---|---|---|---|---|---|---|
| FLOW-20261011-001 | 2026-10-11 | 编码 | `_tmp` 抓取残留导致 manifest 测试全红 | 测试扫描 datasets/ 全部文件，抓取中断无自删 | 删除残留 + 测试豁免 `_tmp/` + 脚本优雅清理 | closed |
| FLOW-20261011-002 | 2026-10-11 | 编码 | 城市数据进了仓库但 `CITIES=[]`（UI 无城市） | fetch-static 后未重跑 gen-bundle，且 B3/B4 漏写 loader 测试 | 重跑 gen-bundle + 补 loader 测试 + 00 文档规则 3 | closed |
| FLOW-20261011-003 | 2026-10-11 | 编码 | 温度点云全部同色（迪斯科球） | tempColor 先钳 dt 到 [0,1] 再除 6，dt≥1 全同色；负通道破坏位打包 | 修正钳制顺序 + 通道钳制 + Node 数值验证 | closed |
| FLOW-20261011-004 | 2026-10-11 | 联调 | 底图关→开后永久黑球 | three-globe globeImageUrl setter 缺陷（OFF 不清 map 不置 needsUpdate；ON 设 color=null 被 uniform 刷新跳过） | 底图显隐改由自定义材质自管 map/color；记入 AGENTS.md | closed |
| FLOW-20261011-005 | 2026-10-11 | 联调 | 底图随机变黑 | 纹理走 unpkg 外链，部分网络不可达 | 纹理本地打包 public/，移除运行时外链 | closed |

## 6. 修订历史

| 日期 | 版本 | 变更类型 | 触发 | 内容 |
|---|---|---|---|---|
| 2026-10-11 | 1.0.0 | 新建 | 用户要求按母文档完善流程 | 建立派生总控 + 01–07 全套文档 + 测试补全（93 条） |
