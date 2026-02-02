const fs = require('fs');
const path = require('path');
const os = require('os');

const USER_HOME = os.homedir();
const CLAUDE_DIR = path.join(USER_HOME, '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const STATUSLINE_SCRIPT = path.join(CLAUDE_DIR, 'statusline-command.sh');

/**
 * 状态栏脚本内容（纯 Bash，无需 jq）
 */
const STATUSLINE_SCRIPT_CONTENT = `#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Debug: Save input to file for troubleshooting (uncomment if needed)
# echo "$input" > ~/.claude/statusline-debug.log

# Parse JSON data using pure bash (no jq needed)
# Extract current_dir: "workspace":{"current_dir":"..."}
current_dir=$(echo "$input" | grep -o '"current_dir":"[^"]*"' | head -1 | sed 's/"current_dir":"//;s/"//')

# Extract model display name: "model":{"display_name":"Sonnet 4.5"}
# Fallback to model.id if display_name is not available
model_display_name=$(echo "$input" | grep -o '"display_name":"[^"]*"' | head -1 | sed 's/"display_name":"//;s/"//')
model_id=$(echo "$input" | grep -o '"id":"claude-[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

# Extract used_percentage (can be integer or float)
used_percentage=$(echo "$input" | grep -o '"used_percentage":[0-9.]*' | head -1 | sed 's/"used_percentage"://')

# Fallback to current working directory if parsing failed
if [ -z "$current_dir" ]; then
    current_dir=$(pwd)
fi

# Extract directory name
dir_name=$(basename "$current_dir")

# Get git branch with dirty indicator
git_info=""
if git -C "$current_dir" rev-parse --git-dir > /dev/null 2>&1; then
    branch=$(git -C "$current_dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
    if [ -n "$branch" ]; then
        # Check if there are uncommitted changes
        if ! git -C "$current_dir" diff --quiet 2>/dev/null || ! git -C "$current_dir" diff --cached --quiet 2>/dev/null; then
            git_info=" [$branch*]"
        else
            git_info=" [$branch]"
        fi
    fi
fi

# Format context usage
ctx_info=""
if [ -n "$used_percentage" ]; then
    used_int=$(printf "%.0f" "$used_percentage")
    ctx_info=" ctx:\${used_int}%"
fi

# Use display_name if available, otherwise derive from model_id
if [ -n "$model_display_name" ]; then
    model_name="$model_display_name"
else
    # Fallback: derive from model_id
    model_name="Claude"
    if [ -n "$model_id" ]; then
        case "$model_id" in
            *opus-4-5*) model_name="Opus 4.5" ;;
            *sonnet-4-5*) model_name="Sonnet 4.5" ;;
            *opus-4*) model_name="Opus 4" ;;
            *sonnet-4*) model_name="Sonnet 4" ;;
            *opus*) model_name="Opus" ;;
            *sonnet*) model_name="Sonnet" ;;
            *haiku*) model_name="Haiku" ;;
        esac
    fi
fi

# Get current time
current_time=$(date +%H:%M)

# Count TODOs in specified file types (limit depth for performance)
todo_count=0
if [ -d "$current_dir" ]; then
    # Use maxdepth 5 and timeout to prevent slowness in large repos
    todo_count=$(timeout 2s find "$current_dir" -maxdepth 5 -type f \\( \\
        -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \\
        -o -name "*.py" -o -name "*.java" -o -name "*.go" \\
        -o -name "*.c" -o -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \\
        -o -name "*.rb" -o -name "*.php" -o -name "*.rs" \\
    \\) -exec grep -ih "TODO\\|FIXME" {} \\; 2>/dev/null | wc -l | tr -d ' ' || echo "0")
fi

# Build status line with blue color for directory name
printf "\\033[34m%s\\033[0m%s%s %s %s" "$dir_name" "$git_info" "$ctx_info" "$model_name" "$current_time"
if [ "$todo_count" -gt 0 ] 2>/dev/null; then
    printf " todos:%s" "$todo_count"
fi
echo
`;

/**
 * 部署状态栏配置
 */
function deployStatusLine() {
    console.log('\n📊 配置自定义状态栏...');

    try {
        // 1. 确保 .claude 目录存在
        if (!fs.existsSync(CLAUDE_DIR)) {
            fs.mkdirSync(CLAUDE_DIR, { recursive: true });
        }

        // 2. 创建状态栏脚本
        fs.writeFileSync(STATUSLINE_SCRIPT, STATUSLINE_SCRIPT_CONTENT, { mode: 0o755 });
        console.log(`   ✅ 创建状态栏脚本: ${STATUSLINE_SCRIPT}`);

        // 3. 更新或创建 settings.json
        let settings = {};
        if (fs.existsSync(SETTINGS_FILE)) {
            try {
                const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
                settings = JSON.parse(content);
            } catch (e) {
                console.warn('   ⚠️  无法解析现有 settings.json，将创建新文件');
            }
        }

        // 4. 添加 statusLine 配置
        settings.statusLine = {
            type: 'command',
            command: 'bash ~/.claude/statusline-command.sh'
        };

        // 5. 保存 settings.json
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
        console.log(`   ✅ 更新配置文件: ${SETTINGS_FILE}`);

        console.log('\n   📋 状态栏功能:');
        console.log('      • 📁 当前目录（蓝色高亮）');
        console.log('      • 🌿 Git 分支 + 脏状态检测');
        console.log('      • 📊 上下文窗口使用率');
        console.log('      • 🤖 模型名称（Opus/Sonnet/Haiku）');
        console.log('      • ⏰ 当前时间');
        console.log('      • 📝 TODO/FIXME 计数');
        console.log('\n   🎨 示例输出:');
        console.log('      \x1b[34meverything-claude-code\x1b[0m [main*] ctx:26% Sonnet 4.5 18:13 todos:5\n');

        return true;
    } catch (error) {
        console.error('   ❌ 状态栏配置失败:', error.message);
        return false;
    }
}

/**
 * 卸载状态栏配置
 */
function uninstallStatusLine() {
    console.log('\n📊 卸载自定义状态栏...');

    try {
        // 1. 删除状态栏脚本
        if (fs.existsSync(STATUSLINE_SCRIPT)) {
            fs.unlinkSync(STATUSLINE_SCRIPT);
            console.log(`   ✅ 删除状态栏脚本: ${STATUSLINE_SCRIPT}`);
        }

        // 2. 从 settings.json 移除配置
        if (fs.existsSync(SETTINGS_FILE)) {
            try {
                const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
                const settings = JSON.parse(content);

                if (settings.statusLine) {
                    delete settings.statusLine;
                    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
                    console.log(`   ✅ 从 settings.json 移除配置`);
                }
            } catch (e) {
                console.warn('   ⚠️  无法解析 settings.json');
            }
        }

        console.log('   ✅ 状态栏配置已卸载\n');
        return true;
    } catch (error) {
        console.error('   ❌ 卸载失败:', error.message);
        return false;
    }
}

module.exports = {
    deployStatusLine,
    uninstallStatusLine
};
