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

| 命令 | 脚本文件 | 说明 |
|------|----------|------|
| `npm run deploy` | `scripts/deploy.js` | 交互式安装程序 |
| `npm run explore` | `scripts/explore.js` | 组件浏览器 (查看说明) |
| `npm run uninstall` | `scripts/uninstall.js` | 选择性卸载程序 |
| `npm run sync` | `scripts/sync-upstream.js` | 上游同步工具 |
| `npm run setup-pm` | `scripts/setup-package-manager.js` | 包管理器配置工具 |