#!/usr/bin/env node

/**
 * Claude Code Helper - 显示所有可用的 shell 别名命令
 */

const os = require('os');

const IS_WINDOWS = process.platform === 'win32';

const commands = [
  {
    name: 'claude-help',
    description: '显示此帮助信息',
    example: 'claude-help'
  },
  {
    name: 'claude-deploy',
    description: '部署/更新 Claude Code 配置（agents, skills, commands, rules, hooks）',
    example: 'claude-deploy --global',
    options: [
      '--global    : 安装到全局 (~/.claude/)',
      '--project   : 安装到当前项目 (./.claude/)',
      '--config=X  : 使用指定配置文件 (如 deployment_frontend.json)',
      '-c X        : --config 的简写'
    ]
  },
  {
    name: 'claude-explore',
    description: '浏览可用的组件（agents, skills, commands）',
    example: 'claude-explore'
  },
  {
    name: 'claude-uninstall',
    description: '卸载 Claude Code 配置（选择性删除，保留私人配置）',
    example: 'claude-uninstall'
  },
  {
    name: 'claude-config',
    description: '配置包管理器偏好（npm/pnpm/yarn/bun）',
    example: 'claude-config'
  },
  {
    name: 'claude-setup-mcp',
    description: '交互式 MCP 服务器配置助手',
    example: 'claude-setup-mcp',
    features: [
      '• 安装核心 MCP (memory + sequential-thinking)',
      '• 按项目类型推荐 MCP 配置',
      '• 上下文成本估算',
      IS_WINDOWS ? '• Windows 自动添加 cmd /c 包装器' : null,
      IS_WINDOWS ? '• 修复现有 Windows MCP 配置' : null
    ].filter(Boolean)
  },
  {
    name: 'claude-sync',
    description: '同步上游仓库更新',
    example: 'claude-sync'
  }
];

function printHelp() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           Everything Claude Code - 命令帮助                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (IS_WINDOWS) {
    console.log('📌 当前系统: Windows\n');
  }

  commands.forEach(cmd => {
    console.log(`  \x1b[36m${cmd.name}\x1b[0m`);
    console.log(`    ${cmd.description}`);
    console.log(`    示例: ${cmd.example}`);

    if (cmd.options) {
      console.log('    选项:');
      cmd.options.forEach(opt => console.log(`      ${opt}`));
    }

    if (cmd.features) {
      console.log('    功能:');
      cmd.features.forEach(feat => console.log(`      ${feat}`));
    }

    console.log('');
  });

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('📂 配置文件位置:');
  console.log(`    全局配置:  ${os.homedir()}/.claude.json (MCP 服务器)`);
  console.log(`    全局目录:  ${os.homedir()}/.claude/ (agents, skills, rules...)`);
  console.log('    项目配置:  ./.claude/ (项目级覆盖)');
  console.log('');
  console.log('📖 更多信息: https://github.com/anthropics/claude-code');
  console.log('');
}

printHelp();
