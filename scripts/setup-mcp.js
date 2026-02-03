#!/usr/bin/env node

/**
 * MCP Configuration Assistant
 *
 * Interactive tool for setting up MCP servers in ~/.claude.json
 * Features:
 * - Minimal core installation (memory + sequential-thinking)
 * - Project-type based recommendations
 * - Context window cost estimation
 * - Safe configuration validation
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// File paths
const CLAUDE_CONFIG_PATH = path.join(os.homedir(), '.claude.json');
const MCP_DEFAULTS_PATH = path.join(__dirname, '../config/mcp-defaults.json');
const MCP_SERVERS_PATH = path.join(__dirname, '../mcp-configs/mcp-servers.json');

// Platform detection
const IS_WINDOWS = process.platform === 'win32';

/**
 * Transform MCP server config for Windows compatibility
 * Windows requires 'cmd /c' wrapper to execute npx
 * @param {Object} serverConfig - Original server configuration
 * @returns {Object} - Platform-adapted configuration
 */
function adaptServerConfigForPlatform(serverConfig) {
  // Only transform if on Windows and using npx command
  if (!IS_WINDOWS) {
    return serverConfig;
  }

  // HTTP-based servers don't need transformation
  if (serverConfig.type === 'http') {
    return serverConfig;
  }

  // Only transform npx commands (not arbitrary executables)
  const command = serverConfig.command?.toLowerCase();
  if (command !== 'npx' && command !== 'node' && command !== 'npm') {
    return serverConfig;
  }

  // Create Windows-compatible config with cmd /c wrapper
  return {
    ...serverConfig,
    command: 'cmd',
    args: ['/c', serverConfig.command, ...(serverConfig.args || [])]
  };
}

// Load configuration files
let mcpDefaults, mcpServers;

try {
  mcpDefaults = JSON.parse(fs.readFileSync(MCP_DEFAULTS_PATH, 'utf8'));
  mcpServers = JSON.parse(fs.readFileSync(MCP_SERVERS_PATH, 'utf8'));
} catch (error) {
  console.error('❌ 无法加载配置文件:', error.message);
  process.exit(1);
}

// Context cost database
const CONTEXT_COSTS = {
  'memory': 1000,
  'sequential-thinking': 2000,
  'github': 5000,
  'firecrawl': 3000,
  'supabase': 4000,
  'vercel': 2000,
  'railway': 3000,
  'cloudflare-docs': 2000,
  'cloudflare-workers-builds': 3000,
  'cloudflare-workers-bindings': 2000,
  'cloudflare-observability': 3000,
  'clickhouse': 4000,
  'context7': 3000,
  'magic': 2000,
  'filesystem': 2000
};

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      // Clean input: remove carriage returns, null bytes, and other control characters
      const cleaned = answer.replace(/[\r\n\x00-\x1f]/g, '').trim();
      resolve(cleaned);
    });
  });
}

// Load current Claude config
function loadClaudeConfig() {
  if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8'));
    } catch (error) {
      console.warn('⚠️  无法解析 ~/.claude.json，将创建新配置');
      return {};
    }
  }
  return {};
}

// Save Claude config
function saveClaudeConfig(config) {
  try {
    // Ensure directory exists
    const dir = path.dirname(CLAUDE_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write with pretty formatting
    fs.writeFileSync(
      CLAUDE_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      'utf8'
    );
    console.log('✅ 配置已保存到 ~/.claude.json');
    return true;
  } catch (error) {
    console.error('❌ 保存配置失败:', error.message);
    return false;
  }
}

// Estimate context cost
function estimateContextCost(enabledMcps) {
  return Object.keys(enabledMcps).reduce((total, name) => {
    return total + (CONTEXT_COSTS[name] || 2500);
  }, 0);
}

// Display current configuration status
function displayCurrentStatus(config) {
  console.log('\n=== 当前 MCP 配置状态 ===\n');

  if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    console.log('❌ 未配置任何 MCP 服务器');
    console.log('💡 建议：至少安装核心 MCP（memory + sequential-thinking）\n');
    return;
  }

  const mcpList = Object.keys(config.mcpServers);
  const totalCost = estimateContextCost(config.mcpServers);
  const contextUsage = ((totalCost / 200000) * 100).toFixed(1);

  console.log(`已启用 MCP 数量: ${mcpList.length}`);
  console.log(`预计上下文成本: ~${(totalCost / 1000).toFixed(1)}k tokens (${contextUsage}% of 200k)`);

  // Warning thresholds
  if (mcpList.length > mcpDefaults.contextWindowLimits.maxEnabledMcps) {
    console.log('\n⚠️  警告：MCP 数量超过推荐上限（10 个）');
    console.log('    可能导致上下文窗口严重退化');
  } else if (mcpList.length > mcpDefaults.contextWindowLimits.warningThreshold) {
    console.log('\n⚠️  注意：MCP 数量较多（> 6 个），建议按项目禁用不需要的服务');
  }

  console.log('\n已启用的 MCP 服务器：');
  mcpList.forEach(name => {
    const cost = CONTEXT_COSTS[name] || 2500;
    const details = mcpDefaults.serverDetails[name];
    const desc = details ? details.description : config.mcpServers[name].description || '(无描述)';
    console.log(`  - ${name.padEnd(30)} ~${(cost / 1000).toFixed(1)}k tokens - ${desc}`);
  });

  console.log('');
}

// Install minimal core MCPs
async function installMinimalCore() {
  console.log('\n=== 安装核心 MCP（最小配置）===\n');
  console.log('将安装以下 MCP 服务器：');
  console.log('  - memory            : 持久化记忆（~1k tokens）');
  console.log('  - sequential-thinking : 链式推理（~2k tokens）');
  console.log('\n总成本: ~3k tokens (1.5% of 200k)');

  if (IS_WINDOWS) {
    console.log('\n📌 检测到 Windows 系统，将自动添加 cmd /c 包装器');
  }
  console.log('');

  const confirm = await question('确认安装？[Y/n]: ');
  if (confirm.trim().toLowerCase() === 'n') {
    console.log('已取消');
    return;
  }

  const config = loadClaudeConfig();
  config.mcpServers = config.mcpServers || {};

  // Add core MCPs with platform adaptation
  config.mcpServers.memory = adaptServerConfigForPlatform(mcpServers.mcpServers.memory);
  config.mcpServers['sequential-thinking'] = adaptServerConfigForPlatform(mcpServers.mcpServers['sequential-thinking']);

  if (saveClaudeConfig(config)) {
    console.log('\n✅ 核心 MCP 安装成功！');
    console.log('🔄 请重启 Claude Code 以生效');
  }
}

// Recommend MCPs by project type
async function recommendByProjectType() {
  console.log('\n=== 按项目类型选择 MCP ===\n');

  const projectTypes = Object.keys(mcpDefaults.projectTypeRecommendations);
  projectTypes.forEach((type, index) => {
    const info = mcpDefaults.projectTypeRecommendations[type];
    console.log(`${index + 1}. ${type.padEnd(20)} - ${info.description}`);
  });

  console.log('');
  const choice = await question('选择项目类型 (输入数字): ');
  const selectedIndex = parseInt(choice) - 1;

  if (selectedIndex < 0 || selectedIndex >= projectTypes.length) {
    console.log('❌ 无效选择');
    return;
  }

  const projectType = projectTypes[selectedIndex];
  const recommendations = mcpDefaults.projectTypeRecommendations[projectType];

  console.log(`\n${recommendations.description} 推荐配置：\n`);

  console.log('✅ 核心（已包含）：');
  console.log('  - memory');
  console.log('  - sequential-thinking\n');

  console.log('✅ 强烈推荐：');
  recommendations.recommended.forEach(mcp => {
    const details = mcpDefaults.serverDetails[mcp];
    console.log(`  - ${mcp.padEnd(30)} : ${details.description}`);
    console.log(`    使用场景: ${details.use_when}`);
    if (details.requires_auth) {
      console.log(`    ⚠️  需要配置环境变量: ${details.env}`);
    }
  });

  console.log('\n⭕ 可选：');
  recommendations.optional.forEach(mcp => {
    const details = mcpDefaults.serverDetails[mcp];
    console.log(`  - ${mcp.padEnd(30)} : ${details.description}`);
  });

  // Calculate total cost
  const allMcps = ['memory', 'sequential-thinking', ...recommendations.recommended];
  const totalCost = allMcps.reduce((sum, name) => sum + (CONTEXT_COSTS[name] || 2500), 0);
  console.log(`\n预计上下文成本: ~${(totalCost / 1000).toFixed(1)}k tokens\n`);

  if (recommendations.notes) {
    console.log(`📝 注意: ${recommendations.notes}\n`);
  }

  if (IS_WINDOWS) {
    console.log('\n📌 检测到 Windows 系统，将自动添加 cmd /c 包装器');
  }

  const install = await question('安装推荐的 MCP？[Y/n]: ');
  if (install.trim().toLowerCase() === 'n') {
    console.log('已取消');
    return;
  }

  const config = loadClaudeConfig();
  config.mcpServers = config.mcpServers || {};

  // Add core + recommended MCPs with platform adaptation
  config.mcpServers.memory = adaptServerConfigForPlatform(mcpServers.mcpServers.memory);
  config.mcpServers['sequential-thinking'] = adaptServerConfigForPlatform(mcpServers.mcpServers['sequential-thinking']);

  recommendations.recommended.forEach(mcp => {
    if (mcpServers.mcpServers[mcp]) {
      config.mcpServers[mcp] = adaptServerConfigForPlatform(mcpServers.mcpServers[mcp]);
      console.log(`✅ 已添加: ${mcp}`);
    }
  });

  if (saveClaudeConfig(config)) {
    console.log('\n✅ 配置完成！');
    console.log('🔄 请重启 Claude Code 以生效');

    // Show auth instructions if needed
    const needsAuth = recommendations.recommended.filter(mcp =>
      mcpDefaults.serverDetails[mcp]?.requires_auth
    );
    if (needsAuth.length > 0) {
      console.log('\n⚠️  以下 MCP 需要配置环境变量：');
      needsAuth.forEach(mcp => {
        const details = mcpDefaults.serverDetails[mcp];
        console.log(`  - ${mcp}: ${details.env}`);
      });
      console.log('\n请在 ~/.claude.json 中配置相应的 env 字段');
    }
  }
}

// List all available MCPs
function listAllMcps() {
  console.log('\n=== 所有可用 MCP 服务器 ===\n');

  const allMcps = Object.keys(mcpDefaults.serverDetails);
  allMcps.forEach(name => {
    const details = mcpDefaults.serverDetails[name];
    const cost = CONTEXT_COSTS[name] || 2500;
    console.log(`${name.padEnd(30)} ~${(cost / 1000).toFixed(1)}k tokens`);
    console.log(`  ${details.description}`);
    console.log(`  使用场景: ${details.use_when}`);
    if (details.requires_auth) {
      console.log(`  ⚠️  需要认证: ${details.env}`);
    }
    console.log('');
  });
}

// Add single MCP
async function addSingleMcp() {
  console.log('\n=== 添加单个 MCP 服务器 ===\n');

  const allMcps = Object.keys(mcpDefaults.serverDetails);
  allMcps.forEach((name, index) => {
    const details = mcpDefaults.serverDetails[name];
    console.log(`${(index + 1).toString().padStart(2)}. ${name.padEnd(30)} - ${details.description}`);
  });

  console.log('');
  const choice = await question('选择要添加的 MCP (输入数字): ');
  const selectedIndex = parseInt(choice) - 1;

  if (selectedIndex < 0 || selectedIndex >= allMcps.length) {
    console.log('❌ 无效选择');
    return;
  }

  const mcpName = allMcps[selectedIndex];
  const details = mcpDefaults.serverDetails[mcpName];

  console.log(`\n将添加: ${mcpName}`);
  console.log(`描述: ${details.description}`);
  console.log(`成本: ~${(CONTEXT_COSTS[mcpName] / 1000).toFixed(1)}k tokens`);
  if (details.requires_auth) {
    console.log(`⚠️  需要配置: ${details.env}`);
  }
  if (IS_WINDOWS && mcpServers.mcpServers[mcpName]?.command) {
    console.log(`📌 Windows: 将自动添加 cmd /c 包装器`);
  }

  const confirm = await question('\n确认添加？[Y/n]: ');
  if (confirm.trim().toLowerCase() === 'n') {
    console.log('已取消');
    return;
  }

  const config = loadClaudeConfig();
  config.mcpServers = config.mcpServers || {};

  if (mcpServers.mcpServers[mcpName]) {
    config.mcpServers[mcpName] = adaptServerConfigForPlatform(mcpServers.mcpServers[mcpName]);

    if (saveClaudeConfig(config)) {
      console.log('\n✅ 添加成功！');
      if (details.requires_auth) {
        console.log(`⚠️  请在 ~/.claude.json 中配置环境变量: ${details.env}`);
      }
      console.log('🔄 请重启 Claude Code 以生效');
    }
  } else {
    console.log(`❌ 未找到 ${mcpName} 的配置模板`);
  }
}

// Remove MCP
async function removeMcp() {
  console.log('\n=== 删除 MCP 服务器 ===\n');

  const config = loadClaudeConfig();
  if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    console.log('❌ 当前没有已配置的 MCP');
    return;
  }

  const mcpList = Object.keys(config.mcpServers);
  mcpList.forEach((name, index) => {
    const cost = CONTEXT_COSTS[name] || 2500;
    console.log(`${(index + 1).toString().padStart(2)}. ${name.padEnd(30)} ~${(cost / 1000).toFixed(1)}k tokens`);
  });

  console.log('');
  const choice = await question('选择要删除的 MCP (输入数字): ');
  const selectedIndex = parseInt(choice) - 1;

  if (selectedIndex < 0 || selectedIndex >= mcpList.length) {
    console.log('❌ 无效选择');
    return;
  }

  const mcpName = mcpList[selectedIndex];
  const confirm = await question(`\n确认删除 ${mcpName}？[y/N]: `);

  if (confirm.trim().toLowerCase() !== 'y') {
    console.log('已取消');
    return;
  }

  delete config.mcpServers[mcpName];

  if (saveClaudeConfig(config)) {
    console.log(`\n✅ 已删除: ${mcpName}`);
    console.log('🔄 请重启 Claude Code 以生效');
  }
}

// Fix Windows MCP configuration (add cmd /c wrapper)
async function fixWindowsConfig() {
  if (!IS_WINDOWS) {
    console.log('\n❌ 此功能仅适用于 Windows 系统');
    return;
  }

  console.log('\n=== 修复 Windows MCP 配置 ===\n');
  console.log('此功能将为所有需要的 MCP 添加 cmd /c 包装器\n');

  const config = loadClaudeConfig();
  if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    console.log('❌ 当前没有已配置的 MCP');
    return;
  }

  // Find MCPs that need fixing
  const needsFix = [];
  Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
    // Skip HTTP-based servers
    if (serverConfig.type === 'http') return;

    // Check if already using cmd wrapper
    if (serverConfig.command?.toLowerCase() === 'cmd') return;

    // Check if using npx/node/npm
    const command = serverConfig.command?.toLowerCase();
    if (command === 'npx' || command === 'node' || command === 'npm') {
      needsFix.push({ name, config: serverConfig });
    }
  });

  if (needsFix.length === 0) {
    console.log('✅ 所有 MCP 配置已经正确，无需修复');
    return;
  }

  console.log(`发现 ${needsFix.length} 个需要修复的 MCP:\n`);
  needsFix.forEach(({ name, config: serverConfig }) => {
    console.log(`  - ${name}: ${serverConfig.command} → cmd /c ${serverConfig.command}`);
  });

  const confirm = await question('\n确认修复？[Y/n]: ');
  if (confirm.trim().toLowerCase() === 'n') {
    console.log('已取消');
    return;
  }

  // Apply fixes
  needsFix.forEach(({ name }) => {
    config.mcpServers[name] = adaptServerConfigForPlatform(config.mcpServers[name]);
  });

  if (saveClaudeConfig(config)) {
    console.log(`\n✅ 已修复 ${needsFix.length} 个 MCP 配置！`);
    console.log('🔄 请重启 Claude Code 以生效');
  }
}

// Main menu
async function mainMenu() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║      MCP 配置助手 - Claude Code              ║');
  console.log('╚═══════════════════════════════════════════════╝');

  const config = loadClaudeConfig();
  displayCurrentStatus(config);

  // Show platform info
  if (IS_WINDOWS) {
    console.log('📌 当前系统: Windows (将自动添加 cmd /c 包装器)\n');
  }

  console.log('请选择操作：\n');
  console.log('1. 安装核心 MCP（minimal-core: memory + sequential-thinking）');
  console.log('2. 按项目类型选择 MCP（前端/后端/全栈/嵌入式/数据科学/Cloudflare）');
  console.log('3. 查看所有可用 MCP 及详细说明');
  console.log('4. 添加单个 MCP');
  console.log('5. 删除 MCP');
  if (IS_WINDOWS) {
    console.log('6. 修复 Windows 配置（为现有 MCP 添加 cmd /c 包装器）');
    console.log('7. 退出\n');
  } else {
    console.log('6. 退出\n');
  }

  const maxOption = IS_WINDOWS ? 7 : 6;
  const choice = await question(`输入选项 (1-${maxOption}): `);

  switch (choice) {
    case '1':
      await installMinimalCore();
      break;
    case '2':
      await recommendByProjectType();
      break;
    case '3':
      listAllMcps();
      await question('\n按 Enter 继续...');
      break;
    case '4':
      await addSingleMcp();
      break;
    case '5':
      await removeMcp();
      break;
    case '6':
      if (IS_WINDOWS) {
        await fixWindowsConfig();
        break;
      }
      // Fall through to exit on non-Windows
      console.log('\n再见！👋');
      rl.close();
      return;
    case '7':
      if (IS_WINDOWS) {
        console.log('\n再见！👋');
        rl.close();
        return;
      }
      console.log('❌ 无效选项');
      break;
    default:
      console.log('❌ 无效选项');
  }

  // Loop back to menu
  await mainMenu();
}

// Start the program
(async () => {
  try {
    await mainMenu();
  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    rl.close();
    process.exit(1);
  }
})();
