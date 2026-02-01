# Everything Claude Code 一键部署系统实施计划

## 项目目标

为 everything-claude-code 的 fork 版本(my-setup 分支)构建一个完整的配置管理和部署系统,支持:
- **一键部署**: 交互式安装到全局或项目级别
- **跨平台**: Windows 11 + macOS (自动检测平台和 Shell)
- **多机器同步**: 通过 Git 管理配置,新机器快速复制环境
- **上游同步**: 辅助脚本帮助手动审查并合并 affaan-m 的更新
- **Shell 集成**: 自动写入 .bashrc/.zshrc,提供便捷命令

---

## 核心设计

### 1. 全局 vs 项目配置

| 特性 | 全局模式 | 项目模式 |
|------|---------|---------|
| 安装位置 | `~/.claude/` | `./.claude/` |
| 适用场景 | 所有项目通用的 agents/skills/rules | 特定项目的定制配置 |
| 同步方式 | 每台机器独立部署 | Git commit → 其他机器 pull 即可用 |
| Shell 别名 | 全局生效 | 需要在项目目录激活 |

### 2. 配置优先级

```
环境变量 CLAUDE_DEPLOY_MODE
  ↓ (未设置)
.claude-deploy/local-config.json (本地配置,不提交Git)
  ↓ (未设置)
config/deployment.json (项目配置,提交到Git)
  ↓ (未设置)
~/.claude/deployment/config.json (用户全局)
  ↓ (未设置)
config/global-defaults.json (系统默认值)
```

### 3. Shell 跨平台策略

**自动检测逻辑:**
- Windows Git Bash: `~/.bashrc`
- macOS: `~/.zshrc` (优先检测 `$SHELL`)
- Linux: `~/.bashrc`

**写入内容示例:**
```bash
# === Everything Claude Code ===
export CLAUDE_PLUGIN_ROOT="/d/Documents/everything-claude-code"
alias claude-deploy="node ${CLAUDE_PLUGIN_ROOT}/scripts/deploy.js"
alias claude-sync="node ${CLAUDE_PLUGIN_ROOT}/scripts/sync-upstream.js"
export CLAUDE_PACKAGE_MANAGER="${CLAUDE_PACKAGE_MANAGER:-pnpm}"
# === End Everything Claude Code ===
```

### 4. 多机器同步机制

**配置记录** (`~/.claude/deployment/machines.json`):
```json
{
  "windows-main": {
    "os": "win32",
    "shell": "bash",
    "shellRc": "C:/Users/Admin/.bashrc",
    "lastSync": "2026-01-31T10:30:00Z"
  },
  "mac-mini": {
    "os": "darwin",
    "shell": "zsh",
    "shellRc": "/Users/admin/.zshrc",
    "lastSync": "2026-01-31T11:00:00Z"
  }
}
```

**同步流程:**
1. Windows 修改配置 → `git commit && git push origin my-setup`
2. Mac 执行 `git pull origin my-setup` → 运行 `claude-deploy`
3. 部署脚本自动检测平台,适配路径和 Shell 配置

---

## 实施步骤

### Phase 1: 基础设施 (核心库)

#### 1.1 Shell 检测模块
**文件**: `scripts/lib/shell-detector.js` (~150行)

**功能:**
- 跨平台检测当前 Shell (bash/zsh/fish)
- 定位 Shell 配置文件路径 (.bashrc/.zshrc)
- 安全地写入/更新配置块 (带标记的 block,避免重复)
- 备份功能 (写入前备份原文件)

**关键函数:**
```javascript
detectShell()           // 返回 { type: 'bash'|'zsh', rcPath: '...' }
getRcFilePath()         // 跨平台获取 RC 文件路径
writeToRc(content)      // 带标记 block 的安全写入
removeFromRc()          // 移除已写入的 block
```

#### 1.2 配置管理模块
**文件**: `scripts/lib/config-manager.js` (~200行)

**功能:**
- 实现 5 层配置优先级加载
- 配置合并和验证
- 配置文件读写 (JSON)
- 环境变量解析

**关键函数:**
```javascript
loadConfig()            // 加载最终有效配置
getConfigPath(level)    // 获取各层级配置文件路径
validateConfig(config)  // 验证配置结构
saveConfig(config, level) // 保存到指定层级
```

#### 1.3 部署管理模块
**文件**: `scripts/lib/deployment-manager.js` (~250行)

**功能:**
- 全局/项目模式的文件复制逻辑
- 组件选择性安装 (agents/skills/commands/rules/hooks)
- 符号链接管理 (可选,用于开发模式)
- 安装验证和回滚

**关键函数:**
```javascript
deployGlobal(components) // 安装到 ~/.claude/
deployProject(components) // 安装到 ./.claude/
createBackup()           // 部署前备份
rollback()               // 恢复备份
verifyInstallation()     // 验证安装完整性
```

### Phase 2: 主部署脚本

#### 2.1 交互式部署脚本
**文件**: `scripts/deploy.js` (~300行)

**功能:**
- 交互式菜单 (选择全局/项目模式)
- 组件选择界面 (多选 agents, skills, commands, rules, hooks)
- 包管理器配置 (复用 setup-package-manager.js)
- Shell 集成选项
- 安装进度显示

**运行流程:**
```
1. 检测当前环境 (OS, Shell, Git状态)
2. 显示欢迎界面和当前配置
3. 交互式选择:
   - 部署模式 (全局/项目)
   - 要安装的组件 (全选/自定义)
   - 包管理器偏好
   - 是否写入 Shell 配置
4. 确认并执行部署
5. 验证安装
6. 显示后续步骤提示
```

**CLI 参数:**
```bash
node scripts/deploy.js                    # 交互式模式
node scripts/deploy.js --global           # 直接全局安装(所有组件)
node scripts/deploy.js --project          # 直接项目安装
node scripts/deploy.js --dry-run          # 模拟运行,不实际修改
node scripts/deploy.js --config my.json  # 使用配置文件安装
```

### Phase 3: 上游同步工具

#### 3.1 上游同步脚本
**文件**: `scripts/sync-upstream.js` (~200行)

**功能:**
- 自动配置 upstream remote (如果未配置)
- 拉取上游更新
- 交互式审查差异 (逐文件显示 diff)
- 选择性合并
- 冲突检测和提示

**运行流程:**
```bash
# 检查更新
claude-sync --check
# 输出: Found 5 new commits from upstream/main

# 审查更新
claude-sync --review
# 交互式显示:
# File: agents/planner.md
# [Changes preview...]
# Merge this file? [y/n/d(iff again)/s(kip all)]

# 自动合并(非冲突部分)
claude-sync --auto-merge
# 冲突文件会列出,需手动处理
```

**关键功能:**
- 使用 `git diff` 显示差异
- 使用 `git merge --no-commit` 测试合并
- 冲突时生成冲突报告
- 支持分文件夹审查 (先看 agents,再看 skills...)

#### 3.2 Shell 别名集成
**在 .bashrc/.zshrc 写入:**
```bash
# Claude Code 部署工具
alias claude-deploy='node ${CLAUDE_PLUGIN_ROOT}/scripts/deploy.js'
alias claude-sync='node ${CLAUDE_PLUGIN_ROOT}/scripts/sync-upstream.js'
alias claude-config='node ${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.js'

# 快捷函数
claude-update-upstream() {
  cd ${CLAUDE_PLUGIN_ROOT}
  git checkout main
  git pull upstream main
  git push origin main
  git checkout my-setup
  echo "Ready to merge. Run: claude-sync --review"
}
```

### Phase 4: 配置文件

#### 4.1 全局默认配置
**文件**: `config/global-defaults.json`

```json
{
  "version": "1.0.0",
  "deploymentMode": "global",
  "components": {
    "agents": {
      "enabled": true,
      "items": ["all"]
    },
    "skills": {
      "enabled": true,
      "items": ["all"]
    },
    "commands": {
      "enabled": true,
      "items": ["all"]
    },
    "rules": {
      "enabled": true,
      "items": ["all"]
    },
    "hooks": {
      "enabled": true
    }
  },
  "packageManager": "pnpm",
  "shellIntegration": {
    "enabled": true,
    "autoDetect": true,
    "aliases": ["claude-deploy", "claude-sync", "claude-config"]
  },
  "backup": {
    "enabled": true,
    "keepCount": 3
  }
}
```

#### 4.2 项目部署配置模板
**文件**: `config/deployment.json` (示例,提交到Git)

```json
{
  "deploymentMode": "project",
  "components": {
    "agents": {
      "items": ["planner", "tdd-guide", "code-reviewer"]
    },
    "skills": {
      "items": ["backend-patterns", "frontend-patterns"]
    },
    "rules": {
      "items": ["coding-standards"]
    }
  }
}
```

#### 4.3 本地配置
**文件**: `.claude-deploy/local-config.json` (gitignored)

```json
{
  "machineId": "windows-main",
  "shellRcPath": "C:/Users/Admin/.bashrc",
  "lastDeployment": "2026-01-31T10:30:00Z",
  "customPaths": {
    "claudeDir": "~/.claude"
  }
}
```

#### 4.4 更新 .gitignore
**添加到 `.gitignore`:**
```
# 本地部署配置(不同步)
.claude-deploy/
*.local.json

# 个人定制 skill (如果有敏感信息)
skills/my-private-*
```

### Phase 5: 文档和测试

#### 5.1 部署指南
**文件**: `docs/deployment-guide.md`

**内容:**
- 快速开始 (5分钟部署)
- 全局 vs 项目模式详解
- 多机器同步教程
- 上游更新流程
- 常见问题排查

#### 5.2 测试清单

**Windows 11 测试:**
- [ ] Git Bash 环境检测
- [ ] .bashrc 写入和备份
- [ ] 全局模式部署到 `~/.claude/`
- [ ] 项目模式部署到 `./.claude/`
- [ ] 包管理器检测 (pnpm 优先)
- [ ] Shell 重启后别名生效

**macOS 测试:**
- [ ] zsh 环境检测
- [ ] .zshrc 写入
- [ ] 全局模式部署
- [ ] Git pull 后重新部署
- [ ] 路径跨平台兼容性

**上游同步测试:**
- [ ] upstream remote 配置
- [ ] 获取最新更新
- [ ] 交互式 diff 审查
- [ ] 非冲突自动合并
- [ ] 冲突文件提示

---

## 关键文件清单

### 需要创建的文件

**脚本 (scripts/):**
- `scripts/deploy.js` - 主部署脚本
- `scripts/sync-upstream.js` - 上游同步工具
- `scripts/lib/shell-detector.js` - Shell 检测库
- `scripts/lib/config-manager.js` - 配置管理库
- `scripts/lib/deployment-manager.js` - 部署逻辑库

**配置 (config/):**
- `config/global-defaults.json` - 默认配置
- `config/deployment.json` - 项目配置模板

**文档 (docs/):**
- `docs/deployment-guide.md` - 部署完整指南

### 需要修改的文件

- `.gitignore` - 添加 `.claude-deploy/` 和本地配置
- `README.md` - 添加一键部署章节和 my-setup 分支说明

---

## 使用流程示例

### 场景1: 首次在 Windows 11 部署

```bash
# 1. Clone fork
git clone https://github.com/YOUR-USERNAME/everything-claude-code.git
cd everything-claude-code
git checkout my-setup

# 2. 配置上游
git remote add upstream https://github.com/affaan-m/everything-claude-code.git

# 3. 运行一键部署
node scripts/deploy.js

# 交互式选择:
# > Deployment mode: [Global] / Project
# > Components: [All selected] agents, skills, commands, rules, hooks
# > Package manager: [pnpm]
# > Write to shell config (.bashrc)? [Yes]

# 4. 重新加载 Shell
source ~/.bashrc

# 5. 验证
claude-deploy --version
```

### 场景2: 同步到 macOS

```bash
# 1. 在 Mac 上 clone
git clone https://github.com/YOUR-USERNAME/everything-claude-code.git
cd everything-claude-code
git checkout my-setup

# 2. 运行部署(自动检测 zsh 和 macOS 路径)
node scripts/deploy.js --global

# 3. 重新加载 Shell
source ~/.zshrc
```

### 场景3: 更新上游代码

```bash
# 1. 在任意机器上执行
claude-update-upstream
# 自动: checkout main → pull upstream → push origin → checkout my-setup

# 2. 审查更新
claude-sync --review
# 逐文件显示 diff,选择性合并

# 3. 提交到 my-setup
git add .
git commit -m "merge: upstream updates from 2026-01-31"
git push origin my-setup

# 4. 其他机器同步
git pull origin my-setup
claude-deploy  # 重新部署(如有新组件)
```

### 场景4: 添加自定义 Skill

```bash
# 1. 在 skills/ 下创建新 skill
mkdir skills/my-custom-skill
vim skills/my-custom-skill/SKILL.md

# 2. 测试部署
node scripts/deploy.js --project
# 选择包含 my-custom-skill

# 3. 提交到 Git
git add skills/my-custom-skill
git commit -m "feat: add my-custom-skill"
git push origin my-setup
```

---

## 后续增强建议

1. **GUI 安装器** (可选): 使用 `inquirer` 或 `prompts` 库美化交互界面
2. **健康检查命令**: `claude-deploy --doctor` 检测配置完整性
3. **卸载脚本**: `scripts/uninstall.js` 清理所有安装
4. **配置导出/导入**: 快速复制配置到新机器
5. **版本管理**: 支持安装特定版本的上游代码
6. **Hooks 测试工具**: 验证 hooks 配置正确性

---

## 验证计划

### 端到端测试流程

1. **全局部署验证:**
   - 运行 `node scripts/deploy.js --global`
   - 检查 `~/.claude/agents/`, `~/.claude/skills/` 等目录
   - 验证 `.bashrc` 已写入 `CLAUDE_PLUGIN_ROOT`
   - 重启终端,测试 `claude-deploy` 命令可用

2. **项目部署验证:**
   - 在测试项目运行 `node scripts/deploy.js --project`
   - 检查 `./.claude/` 目录结构
   - 验证 Claude Code 能读取项目级配置

3. **上游同步验证:**
   - 运行 `claude-sync --check`
   - 运行 `claude-sync --review`,测试交互式 diff
   - 制造一个冲突,验证冲突检测

4. **跨平台验证:**
   - Windows Git Bash: `.bashrc` 路径和内容
   - macOS: `.zshrc` 路径和内容
   - 路径分隔符兼容性 (使用 `path.join`)

---

## 时间线(仅供参考)

**优先级划分:**
- **P0 (核心)**: Phase 1-2 (基础库 + 主部署脚本)
- **P1 (重要)**: Phase 3 (上游同步)
- **P2 (可选)**: Phase 4-5 (配置文件模板 + 文档)

建议先完成 P0,测试可用后再推进 P1-P2。

---

**实施完成后,你将拥有:**
- ✅ 一键部署到任意新机器 (Windows/macOS)
- ✅ 全局和项目级别的灵活配置管理
- ✅ Git 驱动的多机器配置同步
- ✅ 便捷的上游更新审查工具
- ✅ 跨平台 Shell 集成 (自动别名)
- ✅ 完整的配置备份和回滚机制
