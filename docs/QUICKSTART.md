# 快速开始指南：15 分钟完成 Claude Code 增强配置

本指南帮助你在新设备上快速部署 **Everything Claude Code** 项目的所有增强功能。

---

## 📋 前置要求

确保已安装以下工具：

- ✅ **Claude CLI**（官方命令行工具）
- ✅ **Node.js** >= 16
- ✅ **Git**

验证安装：
```bash
claude --version
node --version
git --version
```

---

## 🚀 快速设置（5 步完成）

### 第 1 步：克隆仓库

```bash
git clone <repo-url> everything-claude-code
cd everything-claude-code
npm install
```

### 第 2 步：探索可用组件

```bash
npm run explore
```

这会显示所有可用的：
- **Agents**（代理）：planner, code-reviewer, security-reviewer 等
- **Skills**（技能）：commit, review-pr, pdf 等
- **Commands**（命令）：快捷操作
- **Rules**（规则）：代码风格、Git 工作流等
- **MCP Servers**（MCP 服务器）：github, vercel, supabase 等

### 第 3 步：运行部署脚本

```bash
npm run deploy
```

**交互式选择**：
1. **部署模式**：
   - `Global`（推荐）：安装到 `~/.claude/`，所有项目共享
   - `Project`：安装到当前项目 `./.claude/`，用于团队协作

2. **部署策略**（自动从配置文件读取）：
   - **默认**：使用 `config/deployment.json` 中的极简策略
     - Agents: `planner`, `code-reviewer`
     - Rules: `coding-style`, `git-workflow`, `testing`
   - **自定义**：编辑 `config/deployment.json` 调整部署的组件

3. **MCP 配置**：
   - 推荐选择 `Y`，进入 MCP 配置助手

4. **状态栏配置**：
   - 推荐选择 `Y`，配置自定义状态栏（显示目录/分支/上下文/模型/时间/TODO）

5. **Shell 集成**：
   - 推荐选择 `Y`，添加便捷别名

### 第 4 步：配置 MCP 服务器（核心）

MCP 配置助手会引导你：

**选项 1：最小核心配置（推荐起步）**
- `memory`：持久化记忆（~1k tokens）
- `sequential-thinking`：链式推理（~2k tokens）
- **总成本**：~3k tokens（占 200k 的 1.5%）

**选项 2：按项目类型选择**

根据你的工作类型选择推荐配置：

| 项目类型 | 推荐 MCP | 总成本 |
|---------|---------|--------|
| **前端开发** | memory + sequential-thinking + vercel + github | ~10k tokens |
| **后端开发** | memory + sequential-thinking + supabase + railway | ~11k tokens |
| **全栈开发** | memory + sequential-thinking + github + vercel + supabase | ~16k tokens |
| **嵌入式开发** | memory + sequential-thinking + github + context7 + filesystem | ~12k tokens |
| **数据科学** | memory + sequential-thinking + clickhouse + context7 | ~11k tokens |
| **Cloudflare** | memory + sequential-thinking + cloudflare-docs + cloudflare-workers-builds | ~9k tokens |

**⚠️ 上下文窗口保护规则**：
- 保持 MCP 数量 **< 6 个**（警告阈值）
- 避免超过 **10 个**（硬限制）
- 目标：保护 200k 上下文窗口不退化到 70k

### 第 5 步：验证安装

```bash
# 重启 shell 以应用别名
source ~/.bashrc  # 或 source ~/.zshrc

# 测试别名
claude-explore

# 启动 Claude Code 并验证 MCP
claude
```

在 Claude Code 中运行：
```
/mcp
```

应该看到你配置的 MCP 服务器列表。

---

## 🎯 部署模式选择指南

### 什么时候用 Global 模式？

✅ **推荐场景**（大多数用户）：
- 个人开发机器
- 所有项目使用统一的工具集
- 想要一次配置，处处可用

**优点**：
- 避免每个项目重复配置
- 集中管理，更新简单
- 所有项目自动继承配置

**配置位置**：`~/.claude/`

### 什么时候用 Project 模式？

✅ **推荐场景**：
- 团队协作项目
- 项目有特定的工作流要求
- 需要将配置纳入版本控制

**优点**：
- 配置随项目传递
- 团队成员保持一致
- 可以覆盖全局设置

**配置位置**：`./.claude/`

### 混合模式（最佳实践）

大多数高级用户使用混合策略：

1. **全局安装基础工具**（Global 模式）：
   ```bash
   npm run deploy -- --global
   ```
   安装通用的 agents, skills, commands

2. **项目级定制**（Project 模式）：
   在特定项目中创建 `.claude/deployment.json`：
   
   ```json
   {
     "components": {
       "agents": {
         "items": ["planner"]  // 只需要规划代理
       }
     },
     "mcp": {
       "disabledMcpServers": ["vercel", "railway"]  // 禁用不需要的 MCP
     }
   }
   ```
   
   项目中给出示例`deployment.json.custom`
   
   配置项目级定制步骤
   
   1. 编辑`deployment.json.custom`
   2. `mv config/deployment.json.custom config/deployment.json`
   3. `npm run deploy`  # 会使用 deployment.json

---

## 🧭 MCP 配置策略

### 极简策略（推荐起步）

**第一次配置**：只安装核心 MCP
```bash
npm run setup-mcp
# 选择：1. 安装核心 MCP
```

**结果**：
```json
{
  "mcpServers": {
    "memory": { ... },
    "sequential-thinking": { ... }
  }
}
```

**成本**：~3k tokens（1.5% of 200k）

### 渐进扩展策略

**根据实际需求添加 MCP**：

1. **前端项目**：添加 `vercel`
   ```bash
   claude-setup-mcp
   # 选择：4. 添加单个 MCP → vercel
   ```

2. **需要 PR review**：添加 `github`
   ```bash
   claude-setup-mcp
   # 选择：4. 添加单个 MCP → github
   ```

3. **数据库操作**：添加 `supabase`
   ```bash
   claude-setup-mcp
   # 选择：4. 添加单个 MCP → supabase
   ```

### 项目级禁用策略

**场景**：全局配置了 6 个 MCP，但某个前端项目不需要后端工具。

**解决方案**：在项目目录创建 `.claude/deployment.json`
```json
{
  "mcp": {
    "disabledMcpServers": ["supabase", "railway", "clickhouse"]
  }
}
```

**效果**：该项目中只有 3 个 MCP 生效（memory + sequential-thinking + vercel）。

---

## 🛠️ 决策流程图

```
开始新设备配置
  │
  ├─ 个人开发机器？
  │   ├─ 是 → 使用 Global 模式
  │   └─ 否（团队项目）→ 使用 Project 模式
  │
  ├─ 选择 MCP 配置策略
  │   ├─ 第一次使用 → 最小核心（memory + sequential-thinking）
  │   ├─ 有明确项目类型 → 按类型选择推荐配置
  │   └─ 已有经验 → 手动选择单个 MCP
  │
  ├─ 验证上下文成本
  │   ├─ < 6 个 MCP → ✅ 安全
  │   ├─ 6-10 个 MCP → ⚠️ 考虑项目级禁用
  │   └─ > 10 个 MCP → ❌ 必须减少
  │
  └─ 完成！重启 Claude Code
```

---

## 🔧 故障排查

### 问题 1：组件未加载

**症状**：部署成功，但 Claude Code 中看不到新 agents/skills

**解决方案**：
1. 确认部署模式：
   ```bash
   cat ~/.claude/deployment/config.json  # Global 模式
   # 或
   cat ./.claude/deployment/config.json  # Project 模式
   ```

2. 重启 Claude Code：
   ```bash
   # 完全退出 Claude，然后重新启动
   claude
   ```

3. 验证配置路径：
   ```bash
   ls -la ~/.claude/  # Global
   ls -la ./.claude/  # Project
   ```

### 问题 2：MCP 服务器无法连接

**症状**：MCP 配置了，但 `/mcp` 命令显示连接失败

**可能原因和解决方案**：

1. **环境变量未配置**（如 github 需要 PAT）：
   ```json
   // 编辑 ~/.claude.json
   {
     "mcpServers": {
       "github": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-github"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_ACTUAL_TOKEN"
         }
       }
     }
   }
   ```

2. **网络问题**（HTTP 类型的 MCP）：
   - 检查防火墙设置
   - 验证 URL 是否可访问（如 `https://mcp.vercel.com`）

3. **npx 安装失败**：
   ```bash
   # 手动测试安装
   npx -y @modelcontextprotocol/server-memory
   ```

### 问题 3：上下文窗口压力过大

**症状**：Claude 响应变慢，频繁出现上下文截断警告

**诊断**：
```bash
claude-setup-mcp
# 查看当前配置状态，检查 MCP 数量和上下文成本
```

**解决方案**：
1. **减少全局 MCP**：删除不常用的 MCP
   ```bash
   claude-setup-mcp
   # 选择：5. 删除 MCP
   ```

2. **使用项目级禁用**：在特定项目中禁用部分 MCP
   ```json
   // .claude/deployment.json
   {
     "mcp": {
       "disabledMcpServers": ["mcp1", "mcp2", "mcp3"]
     }
   }
   ```

3. **采用最小核心 + 按需扩展策略**

### 问题 4：Shell 别名不生效

**症状**：`claude-deploy` 等命令提示 "command not found"

**解决方案**：
1. 重新加载 shell 配置：
   ```bash
   source ~/.bashrc  # Bash
   source ~/.zshrc   # Zsh
   ```

2. 验证别名是否写入：
   ```bash
   cat ~/.bashrc | grep claude-deploy
   ```

3. 手动添加（如果自动写入失败）：
   ```bash
   echo 'export CLAUDE_PLUGIN_ROOT="/path/to/everything-claude-code"' >> ~/.bashrc
   echo 'alias claude-deploy="node ${CLAUDE_PLUGIN_ROOT}/scripts/deploy.js"' >> ~/.bashrc
   echo 'alias claude-setup-mcp="node ${CLAUDE_PLUGIN_ROOT}/scripts/setup-mcp.js"' >> ~/.bashrc
   source ~/.bashrc
   ```

---

## 📚 高级配置示例

### 示例 1：全栈开发者的混合配置

**全局配置**（所有项目共享）：
```bash
npm run deploy -- --global
claude-setup-mcp
# 选择：按项目类型 → 全栈开发
```

**前端项目覆盖**（`.claude/deployment.json`）：
```json
{
  "mcp": {
    "disabledMcpServers": ["supabase", "railway"]
  }
}
```

**后端项目覆盖**：
```json
{
  "mcp": {
    "disabledMcpServers": ["vercel", "magic"]
  }
}
```

### 示例 2：嵌入式开发者的专用配置

**全局 MCP**：
```json
{
  "mcpServers": {
    "memory": { ... },
    "sequential-thinking": { ... },
    "github": { ... },
    "context7": { ... },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "D:/Workspace/shared-drivers",
        "D:/Workspace/test-scripts",
        "D:/Documents/datasheets"
      ]
    }
  }
}
```

**成本**：~12k tokens（6% of 200k）

**项目级禁用示例**（某个不需要文件系统访问的项目）：
```json
{
  "mcp": {
    "disabledMcpServers": ["filesystem"]
  }
}
```

### 示例 3：多机器同步方案

**方法 1：版本控制 + 符号链接**
```bash
# 在每台机器上
cd ~/dotfiles
ln -s ~/dotfiles/.claude.json ~/.claude.json
git add .claude.json
git commit -m "Add Claude MCP config"
git push
```

**方法 2：云同步（Dropbox/OneDrive）**
```bash
# 创建符号链接到云同步目录
ln -s ~/Dropbox/configs/.claude.json ~/.claude.json
```

**方法 3：仓库提供的 mcp-servers.json 作为模板**
```bash
# 新机器上快速配置
cd everything-claude-code
npm run setup-mcp
# 选择项目类型，自动配置
```

---

## ✨ 下一步

配置完成后，你可以：

1. **探索 Skills**：
   ```bash
   claude
   /commit  # 智能 Git 提交
   /review-pr 123  # PR 审查
   ```

2. **使用 Agents**：
   ```
   @planner 帮我规划实现用户认证功能
   @code-reviewer 审查这个 PR
   ```

3. **查询 MCP 文档**：
   ```bash
   # 阅读详细的 MCP 配置指南
   cat docs/guides/mcp-configuration-examples.md
   ```

4. **定制规则**：
   ```bash
   # 探索可用规则
   ls ~/.claude/rules/  # Global
   ls ./.claude/rules/  # Project
   
   # 添加自定义规则
   echo "# My Custom Rule" > ~/.claude/rules/my-rule.md
   ```

5. **保持更新**：
   ```bash
   cd everything-claude-code
   npm run sync-upstream  # 同步上游更新
   ```

---

## 📖 相关文档

- **[部署设计文档](design/DEPLOYMENT.md)**：深入了解架构和设计决策
- **[MCP 配置示例](guides/mcp-configuration-examples.md)**：各种工作场景的详细配置
- **[MCP 详细指南](guides/mcp-guide.md)**：每个 MCP 的深入说明（即将推出）

---

## 🆘 需要帮助？

- **问题反馈**：在项目仓库提交 Issue
- **配置问题**：重新运行 `claude-setup-mcp` 调整配置
- **上下文窗口问题**：参考"故障排查 → 问题 3"

---

**🎉 恭喜！你已完成 Claude Code 增强配置！**

现在你拥有：
- ✅ 智能代理（Agents）
- ✅ 强大技能（Skills）
- ✅ 快捷命令（Commands）
- ✅ 代码规则（Rules）
- ✅ 优化的 MCP 配置
- ✅ 便捷的 Shell 别名

享受高效的 AI 辅助开发体验！🚀
