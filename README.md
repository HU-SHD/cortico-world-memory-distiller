# 🐟 Coopanion 记忆蒸馏插件 (Memory Distiller)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Coopanion](https://img.shields.io/badge/Platform-Coopanion%20(Cortico%20World)-blueviolet.svg)]()

为 **Coopanion** (Cortico World) 打造的拟人化长期记忆扩展。赋予 AI 角色（如大肥鱼）类似人类的记忆机制：**遗忘细节，保留索引，潜意识检索**。

大语言模型的上下文窗口（Token）是有限的，无休止的对话必然导致记忆爆炸。传统的 RAG 方案往往记忆碎片化，缺乏连贯的情感。本扩展通过模拟人类的“睡眠与梦境”，定期将短期记忆提炼为长期记忆，并赋予 AI 主观的“情绪权重”，完美解决了长期陪伴场景下的记忆痛点。

---

## ✨ 核心特性

- 🧠 **定期梦境蒸馏 (Distillation)**
  默认每 3 天自动触发一次“梦境整理”。大肥鱼会阅读这三天内的所有原始聊天记录，将其去重、合并、压缩成极简的【核心长期记忆摘要】，彻底解决 Token 膨胀问题。

- 💖 **主观情绪权重 (Emotional Weighting)**
  记忆不再是一视同仁。在蒸馏时，AI 会根据自己的“情感认知”为记忆打分（1-10分）。
  - 用户说：“一定要记得我的生日！” -> AI 赋予 `importance: 10`，永远保留在摘要中。
  - 用户说：“今天天气不错” -> AI 赋予 `importance: 1`，只留存在索引里。

- 🔍 **RAG 潜意识检索 (Subconscious Retrieval)**
  当用户问起“上个月我们讨论的那个游戏叫什么来着？”，如果摘要里没有，AI **不会直接说“我忘了”**。它会自主调用 `recall_archive_memory` 工具，通过 RAG（检索增强生成）去归档的“潜意识”中翻找，然后恍然大悟地回答你。

- 🗂️ **记忆物理隔离与归档**
  原始记忆绝对不会被删除，而是被移入 `archive/` 目录作为冷数据备份。热数据（摘要与 JSON 索引）单独存放，互不干扰。

---

## 🏗️ 工作原理与目录结构

扩展启动后，会在配置的根目录下自动生成以下结构：

```text
data/memory/
├── raw/          # 📥 短期记忆（尚未蒸馏的原始 .md 文件）
├── distilled/    # 🔥 热数据（当前活跃的记忆）
│   ├── MEMORY.md # 提炼后的核心摘要（注入系统提示词）
│   └── INDEX.json# 潜意识索引（包含关键词、文件名和情绪权重）
└── archive/      # 🧊 冷数据（已蒸馏的原始文件，供 RAG 检索翻阅）
```

**工作流全景：**
1. **日常对话**：模型只携带 `MEMORY.md`（摘要）和 `INDEX.json`（索引），Token 消耗极低。
2. **触发蒸馏**：定时器触发或手动输入 `/dream`，读取 `raw/` 下的文件，调用 LLM 生成摘要和 JSON 索引，写入 `distilled/`，并将原文件移入 `archive/`。
3. **深层回忆**：遇到模糊问题时，模型解析 `INDEX.json`，决定调用工具，工具执行 `src/rag.ts` 中的向量检索，在 `archive/` 目录中寻找答案。

---

## 🚀 安装方法

由于 Coopanion 的扩展采用纯 ESM 模块加载机制，安装方式与普通插件略有不同：

1. **克隆并构建项目**：
   ```bash
   git clone https://github.com/YourName/cortico-world-memory-distiller.git
   cd cortico-world-memory-distiller
   npm install
   npm run build
   ```

2. **将项目链接或复制到 Coopanion 扩展目录**：
   Coopanion 扩展的默认安装路径通常为 `%LOCALAPPDATA%\Programs\Coopanion\data\extensions\node_modules\`（Windows）。
   
   *建议使用符号链接（Windows CMD 管理员权限）方便调试：*
   ```cmd
   mklink /J "%LOCALAPPDATA%\Programs\Coopanion\data\extensions\node_modules\cortico-world-memory-distiller" "你的项目绝对路径"
   ```
   *(或者直接将整个文件夹复制过去)*

3. **登记扩展依赖**：
   打开 `data/extensions/package.json`，在 `dependencies` 中添加：
   ```json
   {
     "dependencies": {
       "cortico-world-memory-distiller": "*"
     }
   }
   ```

4. **重启 Coopanion 客户端**：
   由于是 ESM 模块，**修改源码或安装后必须完全重启 Coopanion 进程**。
   
5. **启用扩展**：
   打开 Coopanion **设置 → 高级模式 → 扩展**，启用「记忆蒸馏」，并在「模块」页调整配置。

---

## ⚙️ 配置项说明

在 Coopanion 控制台的「模块」页面，你可以修改以下配置：

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `rawDir` | `string` | `./data/memory/raw/` | 短期/未蒸馏记忆存放目录 |
| `archiveDir` | `string` | `./data/memory/archive/` | 归档的原始记忆存放目录（RAG 检索范围） |
| `distilledDir` | `string` | `./data/memory/distilled/` | 蒸馏后的摘要和索引存放目录 |
| `intervalDays` | `number` | `3` | 自动蒸馏间隔天数 |
| `embeddingModel` | `string` | `text-embedding-3-small` | RAG 检索使用的向量模型 |
| `ragThreshold` | `number` | `0.6` | RAG 检索相似度阈值 (0-1)，越高越严格 |

---

## 🎭 交互示例

**场景一：高优记忆（情绪权重生效）**
> **用户**：“大肥鱼，一定要记得啊，我下周五过生日！”
> **三天后（蒸馏触发）**：模型在生成 JSON 时，识别到“一定要记得”，赋予 `importance: 10`，并写入 `MEMORY.md`。
> **下周三**：
> **用户**：“大肥鱼，明天是什么日子？”
> **大肥鱼**：“当然是你最重要的生日啦！我早就刻在脑子里了！”

**场景二：潜意识检索（RAG 生效）**
> **用户**：“上个月我们讨论的那个游戏叫什么来着？”
> **大肥鱼（查看索引）**：发现有一条“2023-10-15.md 提到了新游戏”，于是调用工具。
> **大肥鱼（RAG 检索）**：翻阅归档文件，找到了聊天记录。
> **大肥鱼**：“我想起来了！是《绝区零》！当时你还说它的画风很酷呢。”

---

## 🛠️ 开发调试提醒

- **热更新限制**：Coopanion 的 World 扩展**不支持运行时热替换**。每次修改 `src/` 下的代码并运行 `npm run build` 后，**必须彻底关闭并重启 Coopanion** 才能看到变化。
- **API 兼容性**：本项目基于 `cortico.api = 6` 开发。如果 Coopanion 主程序更新，请检查 `package.json` 中的 `api` 版本是否仍然匹配。

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。你可以自由地修改、分发，甚至用于商业项目。如果它帮助到了你，欢迎点个 ⭐ Star！
```