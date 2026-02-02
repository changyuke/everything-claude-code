const readline = require('readline');
const { loadConfig } = require('./lib/config-manager');
const { deployGlobal, deployProject } = require('./lib/deployment-manager');
const { writeToRc } = require('./lib/shell-detector');
const { deployStatusLine } = require('./lib/statusline-deployer');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('=== Everything Claude Code Deployment ===');
  
  // 1. Load Config
  let config = loadConfig();
  const defaultMode = config.deploymentMode || 'global';
  
  // Check CLI args
  const args = process.argv.slice(2);
  let mode = defaultMode;
  
  if (args.includes('--global')) mode = 'global';
  if (args.includes('--project')) mode = 'project';
  
  // Interactive if no args
  if (args.length === 0) {
      const modeInput = await question(`Deployment Mode [Global/Project] (default: ${defaultMode}): `);
      if (modeInput.trim().toLowerCase().startsWith('p')) mode = 'project';
      else if (modeInput.trim().toLowerCase().startsWith('g')) mode = 'global';
  }
  
  // 3. Components - Use configuration from config files
  const components = config.components || {
      agents: { enabled: true, items: ['all'] },
      skills: { enabled: true, items: ['all'] },
      commands: { enabled: true, items: ['all'] },
      rules: { enabled: true, items: ['all'] },
      hooks: { enabled: true, items: ['all'] }
  };

  console.log('\n部署组件配置:');
  Object.keys(components).forEach(comp => {
      if (components[comp].enabled !== false) {
          const items = components[comp].items;
          const itemsStr = items.includes('all') ? '全部' : items.join(', ');
          console.log(`  • ${comp}: ${itemsStr}`);
      }
  });
  
  // 4. MCP Configuration (Optional)
  let setupMcp = false;
  if (args.length === 0) {
      const mcpPrompt = await question('配置 MCP 服务器？(强烈推荐) [Y/n]: ');
      if (mcpPrompt.trim().toLowerCase() !== 'n') setupMcp = true;
  }

  // 5. Status Line Configuration (Optional)
  let setupStatusLine = config.statusLine?.enabled !== false;
  if (args.length === 0) {
      const statusLinePrompt = await question('配置自定义状态栏？(显示目录/分支/上下文/模型/时间/TODO) [Y/n]: ');
      if (statusLinePrompt.trim().toLowerCase() === 'n') setupStatusLine = false;
  }

  // 6. Shell Integration
  let doShellInt = true;
  if (args.length === 0) {
     const shellInt = await question('Enable Shell Integration (aliases)? [Y/n]: ');
     if (shellInt.trim().toLowerCase() === 'n') doShellInt = false;
  }
  
  // 7. Execute
  console.log(`\nStarting ${mode} deployment...`);
  try {
      if (mode === 'global') {
          deployGlobal(components);
      } else {
          deployProject(components);
      }

      // Deploy status line if requested
      if (setupStatusLine) {
          deployStatusLine();
      }

      if (doShellInt) {
          const scriptPath = path.resolve(__dirname);
          // Normalize path for shell usage (forward slashes)
          const projectRoot = path.dirname(scriptPath).split(path.sep).join('/');
          
          const shellContent = `export CLAUDE_PLUGIN_ROOT="${projectRoot}"
alias claude-deploy="node \${CLAUDE_PLUGIN_ROOT}/scripts/deploy.js"
alias claude-explore="node \${CLAUDE_PLUGIN_ROOT}/scripts/explore.js"
alias claude-uninstall="node \${CLAUDE_PLUGIN_ROOT}/scripts/uninstall.js"
alias claude-config="node \${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.js"
alias claude-setup-mcp="node \${CLAUDE_PLUGIN_ROOT}/scripts/setup-mcp.js"`;
          
          writeToRc(shellContent);
      }
      
      console.log('\n✅ Deployment Successful!');

      // MCP configuration if requested
      if (setupMcp) {
          console.log('\n=== MCP 配置 ===');
          console.log('正在启动 MCP 配置助手...\n');

          // IMPORTANT: Close the current readline before spawning setup-mcp.js
          // Both scripts use readline on stdin, and having two active readers causes input conflicts
          rl.close();

          const { spawn } = require('child_process');
          const mcpProcess = spawn('node', [path.join(__dirname, 'setup-mcp.js')], {
              stdio: 'inherit'
          });

          await new Promise((resolve) => {
              mcpProcess.on('close', (code) => {
                  if (code === 0) {
                      console.log('\n✅ MCP 配置完成！');
                  }
                  resolve();
              });
          });

          // Already closed, skip finally block close
          if (doShellInt) {
              console.log('\n🔄 重启 shell 以应用别名配置');
          }
          console.log('🔄 重启 Claude Code 以加载所有配置\n');
          return;
      }

      if (doShellInt) {
          console.log('\n🔄 重启 shell 以应用别名配置');
      }
      console.log('🔄 重启 Claude Code 以加载所有配置\n');
  } catch (err) {
      console.error('Deployment Failed:', err);
  } finally {
      rl.close();
  }
}

main();
