# 状态栏配置指南

## 概述

自定义状态栏功能可以在 Claude Code 中显示丰富的上下文信息，帮助你快速了解当前工作环境。

## 功能特性

状态栏会实时显示以下信息：

- 📁 **当前目录**（蓝色高亮）
- 🌿 **Git 分支** + 脏状态检测（* 表示有未提交更改）
- 📊 **上下文窗口使用率**（百分比）
- 🤖 **模型名称**（自动识别 Opus/Sonnet/Haiku）
- ⏰ **当前时间**（24 小时制）
- 📝 **TODO/FIXME 计数**（扫描代码文件）

### 示例输出

```
everything-claude-code [my-setup*] ctx:26% Sonnet 4.5 18:13 todos:5
```

## 一键部署

### 方法 1: 交互式部署

运行部署脚本时会提示是否配置状态栏：

```bash
npm run deploy
```

输出示例：
```
=== Everything Claude Code Deployment ===
Deployment Mode [Global/Project] (default: global):
配置 MCP 服务器？(强烈推荐) [Y/n]:
配置自定义状态栏？(显示目录/分支/上下文/模型/时间/TODO) [Y/n]: y
```

按 `Y` 或直接回车即可启用状态栏配置。

### 方法 2: 命令行参数

```bash
# 使用配置文件中的设置（默认启用）
npm run deploy -- --global

# 非交互式部署会自动使用配置文件设置
```

### 方法 3: 配置文件控制

在 `config/deployment.json` 中设置：

```json
{
  "statusLine": {
    "enabled": true,  // 设置为 false 可禁用
    "description": "自定义状态栏：显示目录、分支、上下文、模型、时间、TODO"
  }
}
```

## 部署后的文件

部署完成后会创建以下文件：

```
~/.claude/
├── statusline-command.sh     # 状态栏脚本（755 可执行）
└── settings.json             # Claude Code 配置（包含 statusLine 配置）
```

### statusline-command.sh

这是一个 Bash 脚本，接收 Claude Code 传递的 JSON 数据并生成状态栏输出。

**特点：**
- ✅ 零依赖（不需要 jq，使用纯 Bash 解析 JSON）
- ✅ 性能优化（限制搜索深度和超时）
- ✅ 容错处理（解析失败时使用默认值）

### settings.json

Claude Code 的配置文件，状态栏配置如下：

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  }
}
```

## 自定义配置

### 修改颜色

编辑 `~/.claude/statusline-command.sh`，找到最后的 `printf` 行：

```bash
# 默认：蓝色目录名
printf "\033[34m%s\033[0m%s%s %s %s" "$dir_name" "$git_info" "$ctx_info" "$model_name" "$current_time"

# 改为绿色：
printf "\033[32m%s\033[0m%s%s %s %s" "$dir_name" "$git_info" "$ctx_info" "$model_name" "$current_time"

# ANSI 颜色代码：
# 30=黑色 31=红色 32=绿色 33=黄色 34=蓝色 35=紫色 36=青色 37=白色
```

### 添加用户名

在脚本中添加：

```bash
# 获取用户名
user_name=$(whoami)

# 修改输出格式
printf "%s@\033[34m%s\033[0m%s%s %s %s" "$user_name" "$dir_name" "$git_info" "$ctx_info" "$model_name" "$current_time"
```

输出：`administrator@everything-claude-code [main*] ctx:26% Sonnet 4.5 18:13`

### 添加 Python 虚拟环境

```bash
# 检测虚拟环境
venv_name=""
if [ -n "$VIRTUAL_ENV" ]; then
    venv_name=" ($(basename $VIRTUAL_ENV))"
fi

# 添加到输出
printf "\033[34m%s\033[0m%s%s%s %s %s" "$dir_name" "$venv_name" "$git_info" "$ctx_info" "$model_name" "$current_time"
```

输出：`my-project (venv) [main*] ctx:26% Sonnet 4.5 18:13`

### 调整 TODO 搜索范围

默认搜索深度为 5 层，支持的文件类型：

```bash
# 当前支持的文件类型
-name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx"
-o -name "*.py" -o -name "*.java" -o -name "*.go"
-o -name "*.c" -o -name "*.cpp" -o -name "*.h" -o -name "*.hpp"
-o -name "*.rb" -o -name "*.php" -o -name "*.rs"
```

修改深度：
```bash
# 改为搜索 3 层（更快）
timeout 2s find "$current_dir" -maxdepth 3 -type f ...

# 改为搜索 10 层（更深入）
timeout 2s find "$current_dir" -maxdepth 10 -type f ...
```

添加文件类型：
```bash
# 添加 .vue 和 .swift 文件
-name "*.js" -o -name "*.ts" -o -name "*.vue" -o -name "*.swift"
```

### 启用调试模式

取消注释脚本中的调试行：

```bash
# Debug: Save input to file for troubleshooting (uncomment if needed)
echo "$input" > ~/.claude/statusline-debug.log
```

然后查看实际接收到的 JSON 数据：
```bash
cat ~/.claude/statusline-debug.log | jq .
```

## 卸载

### 方法 1: 使用卸载脚本

```bash
npm run uninstall
```

会提示：
```
Remove Status Line Configuration? [y/N]: y
```

### 方法 2: 手动卸载

删除相关文件：

```bash
rm ~/.claude/statusline-command.sh
rm ~/.claude/statusline-debug.log  # 如果存在
```

从 `~/.claude/settings.json` 中删除 `statusLine` 配置：

```json
{
  // 删除这个配置块
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  }
}
```

## 故障排查

### 状态栏不显示

**可能原因：**
1. Claude Code 未重启
2. 脚本权限不正确
3. Bash 不可用

**解决方法：**
```bash
# 重启 Claude Code
# 重新打开终端

# 检查脚本权限
ls -l ~/.claude/statusline-command.sh
# 应该显示 -rwxr-xr-x

# 修复权限
chmod +x ~/.claude/statusline-command.sh

# 测试脚本
echo '{"workspace":{"current_dir":"."}}' | bash ~/.claude/statusline-command.sh
```

### 缺少某些信息

**可能原因：**
- JSON 解析失败
- 变量为空

**解决方法：**
```bash
# 启用调试模式
sed -i 's/# echo "\$input"/echo "\$input"/' ~/.claude/statusline-command.sh

# 重启 Claude Code 后查看日志
cat ~/.claude/statusline-debug.log
```

### 性能问题（状态栏更新慢）

**可能原因：**
- 仓库太大
- TODO 搜索深度太深

**解决方法：**
```bash
# 减少搜索深度
sed -i 's/maxdepth 5/maxdepth 3/' ~/.claude/statusline-command.sh

# 减少超时时间
sed -i 's/timeout 2s/timeout 1s/' ~/.claude/statusline-command.sh

# 或者完全禁用 TODO 计数
# 注释掉 todo_count 相关行
```

## 高级用法

### 条件显示

只在 Git 仓库中显示分支信息：

```bash
# Git 信息已经是条件显示的
if git -C "$current_dir" rev-parse --git-dir > /dev/null 2>&1; then
    # 只有在 Git 仓库中才会显示分支
fi
```

只在 TODO 数量大于 0 时显示：

```bash
# TODO 计数已经是条件显示的
if [ "$todo_count" -gt 0 ] 2>/dev/null; then
    printf " todos:%s" "$todo_count"
fi
```

### 集成其他工具

**Docker 状态：**
```bash
docker_info=""
if [ -f "$current_dir/docker-compose.yml" ]; then
    running=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
    if [ "$running" -gt 0 ]; then
        docker_info=" 🐳:$running"
    fi
fi
```

**Node.js 版本：**
```bash
node_version=""
if [ -f "$current_dir/package.json" ]; then
    node_version=" node:$(node -v 2>/dev/null | sed 's/v//')"
fi
```

**系统负载：**
```bash
load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
```

## 技术细节

### JSON 解析策略

脚本使用纯 Bash（grep + sed）解析 JSON，避免依赖 jq：

```bash
# 提取 current_dir
current_dir=$(echo "$input" | grep -o '"current_dir":"[^"]*"' | head -1 | sed 's/"current_dir":"//;s/"//')

# 提取 display_name
model_display_name=$(echo "$input" | grep -o '"display_name":"[^"]*"' | head -1 | sed 's/"display_name":"//;s/"//')

# 提取 used_percentage（数字）
used_percentage=$(echo "$input" | grep -o '"used_percentage":[0-9.]*' | head -1 | sed 's/"used_percentage"://')
```

**局限性：**
- 无法处理嵌套引号
- 无法处理复杂的转义字符
- 只适用于简单、已知结构的 JSON

**适用场景：**
- Claude Code 的 statusLine 输入（结构固定且简单）

### 性能优化

1. **限制搜索深度：** `maxdepth 5` 避免深度遍历
2. **超时保护：** `timeout 2s` 防止大型仓库卡顿
3. **文件类型过滤：** 只扫描常见代码文件
4. **Git 快速检查：** 使用 `--quiet` 避免输出

### ANSI 转义序列

```bash
\033[34m  # 设置前景色为蓝色
\033[0m   # 重置所有属性

# 其他颜色
\033[31m  # 红色
\033[32m  # 绿色
\033[33m  # 黄色

# 样式
\033[1m   # 粗体
\033[2m   # 暗淡
\033[4m   # 下划线
```

## 参考资料

- [Claude Code 官方文档](https://github.com/anthropics/claude-code)
- [Bash 条件表达式](https://www.gnu.org/software/bash/manual/html_node/Bash-Conditional-Expressions.html)
- [ANSI 转义码](https://en.wikipedia.org/wiki/ANSI_escape_code)

## 贡献

如果你有新的状态栏功能想法或改进建议，欢迎：

1. 提交 Issue：描述你的需求
2. 提交 PR：直接贡献代码
3. 分享配置：在 Discussions 中分享你的自定义配置

## 许可证

与主项目相同（MIT License）
