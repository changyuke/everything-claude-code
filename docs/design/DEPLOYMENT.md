# 部署与管理指南

本仓库包含了一套定制工具，旨在让您在多台机器上安全、轻松地管理 **Everything Claude Code** 配置。

## 快速开始

### 1. 探索功能
在安装任何东西之前，先看看有哪些可用的工具：
```bash
npm run explore
```
*列出所有代理 (Agents)、技能 (Skills) 和命令 (Commands) 及其详细说明。*

### 2. 安装 (项目模式 - 推荐)
将配置安全地安装到当前文件夹的 `.claude/` 目录中。这**不会**影响您的全局设置，适合在特定项目中试用。
```bash
npm run deploy
# 提示时选择 "Project" 模式
```

### 3. 安装 (全局模式)
将配置安装到您的用户主目录 (`~/.claude/`)，使其在所有项目中均可用。
```bash
npm run deploy -- --global
```

### 4. 卸载
安全地移除本项目安装的配置。
```bash
npm run uninstall
```
*注意：执行的是“选择性卸载”——它只会删除本项目包含的文件，完全保留您自己创建的私人配置。*

---

## 保持更新 (同步上游)

由于这是一个 Fork 版本，建议您使用同步工具从上游仓库 (`affaan-m/everything-claude-code`) 获取更新，而不是手动合并。

```bash
npm run sync
```
这个交互式工具会自动：
1. 配置 `upstream` 远程仓库。
2. 拉取 (Fetch) 最新更新。
3. 显示新提交的摘要。
4. 提供 **合并 (Merge)**、**变基 (Rebase)** 或 **查看差异 (View Diff)** 的选项。

---

## Shell 集成 (命令行快捷键)

在部署过程中，您可以选择开启 **Shell 集成**。这会在您的 `.bashrc` 或 `.zshrc` 中添加别名，让您可以在任何地方管理 Claude Code：

- `claude-deploy`: 运行部署向导。
- `claude-explore`: 列出可用组件。
- `claude-uninstall`: 卸载配置。
- `claude-sync`: 同步上游更新。
- `claude-config`: 配置包管理器偏好。

---

## 高级配置

### 项目级配置
您可以编辑 `config/deployment.json` 来定制特定项目需要安装哪些组件：

```json
{
  "deploymentMode": "project",
  "components": {
    "agents": { "items": ["planner", "code-reviewer"] }, 
    "skills": { "items": ["all"] }
  }
}
```
*在这个例子中，只有 `planner` 和 `code-reviewer` 这两个代理会被安装。*

### 全局默认值
系统级的默认配置存储在 `config/global-defaults.json` 中。

---

## 脚本参考手册

### 核心部署工具

| 命令 | 脚本文件 | 说明 |
|------|----------|------|
| `npm run deploy` | `scripts/deploy.js` | 交互式安装程序 |
| `npm run explore` | `scripts/explore.js` | 组件浏览器 (查看说明) |
| `npm run uninstall` | `scripts/uninstall.js` | 选择性卸载程序 |
| `npm run sync` | `scripts/sync-upstream.js` | 上游同步工具 |
| `npm run setup-pm` | `scripts/setup-package-manager.js` | 包管理器配置工具 |

### 增强工具 (基于 Longform Guide 最佳实践)

| 命令 | 脚本文件 | 说明 |
|------|----------|------|
| `npm run setup-mcp` | `scripts/setup-mcp.js` | **MCP 配置助手** - 交互式 MCP 服务器配置，上下文成本估算，项目类型推荐 |
| `npm run setup-contexts` | `scripts/create-context-profiles.js` | 创建动态系统提示 profiles (dev/review/research/debug/refactor)，节省 30-40% tokens |
| `npm run worktree` | `scripts/worktree-manager.js` | Git worktree 管理器，支持并行 Claude 实例无代码冲突 |
| `npm run session` | `scripts/quick-session.js` | 极简会话记录，用于跨天工作的上下文保留 |

详见 [改进报告](../IMPROVEMENTS.md) 了解使用方法。

---

## MCP 配置管理

**MCP (Model Context Protocol)** 是 Claude Code 的核心扩展机制，允许 Claude 访问外部服务（如 GitHub、Vercel、Supabase）和工具（如文档搜索、文件系统操作）。

### 为什么需要 MCP 配置管理？

**上下文窗口压力**：
- Claude Code 的 200k 上下文窗口看似巨大，但**过多 MCP 工具会严重退化性能**
- 根据 `the-shortform-guide.md`（第 137-144 行）：
  > "Your 200k context window before compacting might only be 70k with too many tools enabled."

**建议规则**：
- **< 10 个 MCP 服务器**启用
- **< 80 个活动工具**
- 实际最佳实践：**4-6 个 MCP/项目**

### 快速配置 MCP

#### 方法 1：使用 MCP 配置助手（推荐）

```bash
npm run setup-mcp
# 或使用别名（部署后）
claude-setup-mcp
```

**交互式功能**：
1. 安装核心 MCP（memory + sequential-thinking）
2. 按项目类型选择推荐配置（前端/后端/全栈/嵌入式/数据科学/Cloudflare）
3. 查看所有可用 MCP 及详细说明
4. 添加/删除单个 MCP
5. 显示当前配置和上下文成本估算

#### 方法 2：手动编辑 ~/.claude.json

**最小核心配置**（推荐起步）：
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**成本**：~3k tokens（1.5% of 200k）

### 默认配置策略：极简主义

`config/global-defaults.json` 采用**极简策略**，保护上下文窗口：

**核心组件**（默认启用）：
- **Agents**：`planner`, `code-reviewer`（只启用最常用的两个）
- **Skills**：`all`（轻量级，prompt 级别）
- **Commands**：`all`（快捷方式，无上下文成本）
- **Rules**：`coding-style`, `git-workflow`, `testing`（核心规则）
- **Hooks**：`all`（事件驱动，运行时执行）

**MCP 策略**：
- **默认**：只推荐 `memory` + `sequential-thinking`（~3k tokens）
- **扩展**：根据项目类型添加 1-2 个专用 MCP
- **上限**：保持总数 < 6 个

### 配置位置决策

#### 全局模式 vs. 项目模式

| 配置类型 | 推荐位置 | 适用场景 |
|---------|---------|---------|
| **通用组件**（agents, skills, commands, rules） | 全局（`~/.claude/`） | 个人开发机器，所有项目共享 |
| **MCP 服务器** | 用户级（`~/.claude.json`） | MCP 配置始终在用户级 |
| **项目定制** | 项目级（`./.claude/deployment.json`） | 团队协作、项目特定规则 |
| **MCP 禁用** | 项目级（`disabledMcpServers`） | 项目切换时调整 MCP |

**决策记录**（commit 1643680 后新增）：

**问题**：通用组件应该安装在全局还是项目级？

**决策**：默认使用**全局模式**（`deploymentMode: "global"`）

**理由**：
1. **避免重复**：agents, skills, commands 等通用工具跨项目可用
2. **简化维护**：全局配置统一更新
3. **灵活覆盖**：项目级配置可覆盖全局设置

**实践建议**：
1. **首次安装**：`npm run deploy -- --global`（安装通用组件到全局）
2. **项目定制**：在特定项目运行 `npm run deploy -- --project`（添加项目专用配置）
3. **MCP 管理**：MCP 配置在 `~/.claude.json`，项目级用 `disabledMcpServers` 调整

### 项目级 MCP 禁用策略

**场景**：全局配置了 6 个 MCP，但前端项目不需要后端工具。

**解决方案**：在项目目录创建 `.claude/deployment.json`：
```json
{
  "mcp": {
    "disabledMcpServers": ["supabase", "railway", "clickhouse"]
  }
}
```

**效果**：该项目只有 3 个 MCP 生效（memory + sequential-thinking + vercel）。

### 上下文窗口管理最佳实践

#### 上下文成本估算

| MCP Server | 成本估算 | 累计成本 |
|-----------|---------|---------|
| memory | ~1k tokens | 1k |
| sequential-thinking | ~2k tokens | 3k |
| vercel | ~2k tokens | 5k |
| github | ~5k tokens | 10k |
| supabase | ~4k tokens | 14k |
| railway | ~3k tokens | 17k ⚠️ |

**健康度标准**：
- ✅ **优秀**：< 5%（< 10k tokens）
- ✅ **健康**：5-10%（10-20k tokens）
- ⚠️ **警告**：10-15%（20-30k tokens）
- ❌ **危险**：> 15%（> 30k tokens）

#### 优化建议

1. **起步极简**：只安装核心 MCP（memory + sequential-thinking）
2. **按需扩展**：根据实际工作需求添加 1-2 个专用 MCP
3. **项目切换**：使用 `disabledMcpServers` 禁用当前项目不需要的 MCP
4. **定期审查**：每月检查 MCP 使用情况，移除不再使用的服务

#### 诊断和优化流程

```bash
# 1. 检查当前配置状态
npm run setup-mcp
# 查看 MCP 数量和上下文成本估算

# 2. 如果成本过高（> 15k tokens）
#    选择：5. 删除 MCP
#    移除不常用的 MCP

# 3. 如果只是某个项目不需要
#    创建项目级禁用配置
cat > .claude/deployment.json <<EOF
{
  "mcp": {
    "disabledMcpServers": ["mcp1", "mcp2"]
  }
}
EOF

# 4. 验证效果
claude
# 在 Claude Code 中运行
/mcp
# 确认只显示需要的 MCP
```

### MCP 配置示例

详见 [MCP 配置示例文档](../guides/mcp-configuration-examples.md)，包含：
- 前端开发（React/Next.js）
- 后端开发（Node.js + Supabase）
- 全栈开发（Next.js + Supabase）
- Cloudflare Workers 开发
- 数据科学/分析
- 嵌入式软件开发（MCU/AUTOSAR）

每个场景提供完整的配置文件、环境变量设置、上下文成本分析和项目级调整示例。

### 配置优先级

```
环境变量 > 本地配置 > 项目配置 > 全局配置 > 系统默认

具体路径：
CLAUDE_DEPLOY_MODE > .claude-deploy/local-config.json > config/deployment.json > ~/.claude/deployment/config.json > config/global-defaults.json
```

### 相关文档

- **[快速开始指南](../QUICKSTART.md)**：15 分钟完成新设备配置
- **[MCP 配置示例](../guides/mcp-configuration-examples.md)**：按工作场景的详细配置
- **[改进报告](../IMPROVEMENTS.md)**：设计理念和最佳实践来源

---

## 配置文件参考

### 全局默认配置（config/global-defaults.json）

存储系统级默认设置，包括：
- 部署模式（global/project）
- 组件启用策略（agents, skills, commands, rules, hooks）
- MCP 策略（minimal-core）
- 包管理器偏好

**极简策略**（commit 后新增）：
```json
{
  "deploymentMode": "global",
  "components": {
    "agents": {
      "items": ["planner", "code-reviewer"],
      "rationale": "只启用最常用的两个代理"
    },
    "rules": {
      "items": ["coding-style", "git-workflow", "testing"],
      "rationale": "只启用通用规则，避免规则过多"
    }
  },
  "mcp": {
    "strategy": "minimal-core"
  },
  "_comments": {
    "strategy": "极简策略 - 保护 200k 上下文窗口"
  }
}
```

### MCP 默认配置（config/mcp-defaults.json）

**新增文件**（commit 后添加）：

存储 MCP 服务器的元数据和决策指南：
- **coreServers**：核心 MCP（memory, sequential-thinking）
- **projectTypeRecommendations**：按项目类型的推荐配置
- **serverDetails**：每个 MCP 的详细信息（描述、使用场景、认证需求、上下文成本）
- **contextWindowLimits**：上下文窗口限制和警告阈值
- **decisionGuide**：配置决策流程

**用途**：
- `setup-mcp.js` 脚本的数据源
- 提供智能推荐和成本估算
- 文档化每个 MCP 的使用场景

### 项目配置（config/deployment.json）

项目特定配置，可覆盖全局默认值：
```json
{
  "deploymentMode": "project",
  "components": {
    "agents": {
      "items": ["planner"]
    }
  },
  "mcp": {
    "disabledMcpServers": ["vercel", "railway"]
  }
}
```

### MCP 服务器库（mcp-configs/mcp-servers.json）

包含所有可用 MCP 的完整配置模板（15 个服务器）：
- github, firecrawl, supabase, memory, sequential-thinking
- vercel, railway, cloudflare-*, clickhouse, context7, magic, filesystem

**用途**：
- 复制到 `~/.claude.json` 的模板源
- `setup-mcp.js` 的配置数据库

### MCP 最小配置（mcp-configs/mcp-minimal.json）

**新增文件**（commit 后添加）：

可直接复制到 `~/.claude.json` 的最小配置：
```json
{
  "mcpServers": {
    "memory": { ... },
    "sequential-thinking": { ... }
  },
  "_totalCost": "~3k tokens - safe baseline"
}
```

**用途**：
- 新用户快速起步
- 基线配置，按需扩展