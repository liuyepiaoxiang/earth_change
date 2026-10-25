# SEO + GEO 持续优化策略

> 目标：让 earth-change.vercel.app 在 Google 搜索和 AI 搜索（ChatGPT/Perplexity/Google AI）中持续获得流量

---

## 第一部分：关键词策略（三层漏斗）

### 🎯 核心层（高意图，月搜索量 1K-10K）

这些是你的产品直接回答的问题——用户在找你：

| 关键词 | 搜索意图 | 目标页面 | 竞争度 |
|---|---|---|---|
| climate change simulator | 找工具 | / | 中 |
| sea level rise map | 看可视化 | / | 高 |
| global warming simulator | 找工具 | / | 中 |
| IPCC SSP scenarios explained | 学习概念 | /overview | 低 |
| climate model visualization | 找示例 | / | 低 |
| interactive climate model | 找工具 | / | 低 |
| future earth simulation | 找工具 | / | 低 |
| climate projection tool | 找工具 | / | 低 |

### 📚 教育层（信息型，月搜索量 10K-100K）

这些带来大量流量——用户在学习，不一定在找工具：

| 关键词 | 搜索意图 | 内容形式 | 竞争度 |
|---|---|---|---|
| what are SSP scenarios | 概念学习 | /overview 概念卡 | 低 |
| how much will sea level rise by 2100 | 数据查询 | / FAQ | 高 |
| 1.5 vs 2 degrees warming difference | 对比学习 | /对比 tab | 中 |
| which cities will be underwater | 城市查询 | /（城市点击） | 中 |
| climate tipping points explained | 概念学习 | /overview | 低 |
| permafrost carbon release | 概念学习 | /overview | 低 |
| AMOC shutdown consequences | 概念学习 | /overview | 低 |
| ocean acidification pH levels | 数据查询 | /影响 tab | 低 |

### 🔍 长尾层（具体问题，月搜索量 100-1K）

竞争最低，转化率最高——用户有非常具体的问题：

| 关键词 | 搜索意图 | 内容形式 |
|---|---|---|
| will shanghai flood by 2100 | 城市查询 | /（点击上海） |
| miami sea level rise 2050 | 城市查询 | /（点击迈阿密） |
| SSP2-4.5 temperature projection 2100 | 数据查询 | /API |
| difference between SSP1-2.6 and SSP5-8.5 | 对比 | /对比 tab |
| climate model vs weather forecast difference | 概念澄清 | /overview FAQ |
| how accurate are climate models | 信任建立 | /结果说明 tab |
| greenhouse gas forcing CO2 formula | 技术查询 | /overview 公式卡 |

---

## 第二部分：GEO 策略（让 AI 引用你）

AI 搜索引擎（ChatGPT/Perplexity/Copilot）的引用逻辑与 Google 不同：

### GEO 核心原则

| 原则 | 做法 | 为什么 |
|---|---|---|
| **可提取的事实** | 每个页面有明确的数字+来源 | AI 需要引用有来源的数据 |
| **Q&A 格式** | 内容组织成问答对 | AI 偏好提取问答结构 |
| **结构化表格** | 关键数据用 HTML table | AI 解析表格最可靠 |
| **明确定义** | 「什么是 SSP？」等术语段落 | AI 需要定义来回答用户 |
| **llms.txt** | 告诉 AI 爬虫你的数据结构 | AI 优先查看 llms.txt |

### GEO 关键词（AI 搜索场景）

用户在 ChatGPT/Perplexity 里的问法与 Google 搜索不同：

```
Google 搜索:  "sea level rise 2100"
ChatGPT 问:   "How much will sea levels rise by 2100 under different emission scenarios?"
Perplexity 问: "Which coastal cities will be most affected by sea level rise by 2050?"
Copilot 问:   "Compare the temperature projections of SSP2-4.5 and SSP5-8.5"
```

**GEO 优化动作**：在页面内容中直接以完整问句形式呈现这些数据（而不只是关键词）。

---

## 第三部分：内容路线图（月度计划）

### 第 1 个月：基础设施

| 周 | 任务 | 产出 |
|---|---|---|
| W1 | Google Search Console 提交 + 验证 | 网站被 Google 索引 |
| W1 | Bing Webmaster 提交 | 被 Bing 索引 |
| W2 | llms.txt 完善（AI 可引用事实清单） | AI 爬虫友好 |
| W2 | FAQ schema 补充（8 个问题含答案） | 富摘要候选 |
| W3 | 创建 /learn/spp-scenarios 教育页 | 核心关键词落地页 |
| W3 | 创建 /learn/sea-level-rise 教育页 | 教育层关键词 |
| W4 | 创建 /learn/tipping-points 教育页 | 教育层关键词 |
| W4 | X/知乎发布首篇内容 | 初始外链 |

### 第 2 个月：内容扩展

| 周 | 任务 | 产出 |
|---|---|---|
| W1 | /learn/cities-underwater（城市系列） | 长尾流量入口 |
| W2 | /learn/1.5-vs-2-degrees（对比分析） | 高搜索量教育页 |
| W3 | /learn/how-accurate-climate-models（信任建设） | E-E-A-T 信号 |
| W4 | API 文档页面（/docs/api） | 开发者长尾 |

### 第 3 个月：外链与传播

| 周 | 任务 | 产出 |
|---|---|---|
| W1 | Product Hunt 发布 | 高质量外链 + 流量 |
| W2 | 知乎/Reddit r/climate 发帖 | 社区外链 |
| W3 | 联系气候教育博主（合作/提及） | 权威外链 |
| W4 | GitHub 开源社区分享（Show HN） | 技术外链 |

### 持续（每周）

| 频率 | 任务 |
|---|---|
| 每周 | Search Console 检查索引状态 + 点击数据 |
| 每周 | 分析哪些关键词有展示但无点击 → 优化 title |
| 每两周 | 添加 1 个新的教育内容页 |
| 每月 | 审查 GEO 效果（AI 搜索是否引用你） |

---

## 第四部分：技术优化清单

### 已完成 ✅

- [x] Metadata（title/description/keywords/canonical/robots）
- [x] Open Graph + Twitter Card
- [x] JSON-LD（WebApplication + FAQPage）
- [x] robots.txt（含 sitemap 引用）
- [x] sitemap.xml（Next.js 自动生成）
- [x] llms.txt（AI 爬虫指引）
- [x] H1 标签 + 静态 SEO 文字段
- [x] noscript 降级（JS 禁用时可见内容）
- [x] Google Search Console 验证 meta
- [x] HTTPS + viewport + charset

### 待做 🔲

- [ ] Product schema（每个产品/工具页面）
- [ ] BreadcrumbList schema
- [ ] Core Web Vitals 优化（INP/LCP/CLS）
- [ ] 图片 lazy loading + WebP 格式
- [ ] 多语言 hreflang 标签
- [ ] 404 页面（自定义 + 搜索建议）
- [ ] 结构化数据验证（Google Rich Results Test）

---

## 第五部分：度量与迭代

### 核心指标（在 Search Console 看）

| 指标 | 含义 | 目标（3个月） |
|---|---|---|
| 总点击数 | 从 Google 获得的访问 | 100+ |
| 总展示数 | 出现在搜索结果中的次数 | 10,000+ |
| 平均排名 | 关键词平均排名位置 | < 30 |
| 索引页面数 | Google 已收录的页面 | 10+ |

### GEO 指标（手动检查）

| 检查方式 | 频率 |
|---|---|
| 在 ChatGPT 问「climate change simulator」看是否被提及 | 每月 |
| 在 Perplexity 搜「sea level rise visualization」 | 每月 |
| 检查 Google AI Overviews 是否引用你的内容 | 每月 |

### 迭代循环

```
Search Console 数据（每两周）
  → 发现高展示低点击的页面
  → 优化 title/description
  → 部署更新
  → 观察下一周期数据变化
  → 重复
```

---

## 快速行动（今天就能做的 5 件事）

1. **提交 Bing Webmaster**（[bing.com/webmasters](https://www.bing.com/webmasters)）—— 从 Google Search Console 一键导入
2. **在 X 上发一条带链接的帖子**——首个外链信号
3. **在知乎回答一个气候相关问题**——附上你的网站链接
4. **在 ChatGPT 里测试**——问「interactive climate change simulator」看 AI 是否能找到类似工具
5. **检查 Google Search Console**——看验证是否通过、sitemap 是否被索引
