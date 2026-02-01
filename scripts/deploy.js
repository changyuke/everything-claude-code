const readline = require('readline');
const { loadConfig } = require('./lib/config-manager');
const { deployGlobal, deployProject } = require('./lib/deployment-manager');
const { writeToRc } = require('./lib/shell-detector');
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
  
  // 3. Components
  // For now, default to all if not interactive or full selection
  const components = {
      agents: { enabled: true, items: ['all'] },
      skills: { enabled: true, items: ['all'] },
      commands: { enabled: true, items: ['all'] },
      rules: { enabled: true, items: ['all'] },
      hooks: { enabled: true, items: ['all'] }
  };
  
  // 4. Shell Integration
  let doShellInt = true;
  if (args.length === 0) {
     const shellInt = await question('Enable Shell Integration (aliases)? [Y/n]: ');
     if (shellInt.trim().toLowerCase() === 'n') doShellInt = false;
  }
  
  // 5. Execute
  console.log(`\nStarting ${mode} deployment...`);
  try {
      if (mode === 'global') {
          deployGlobal(components);
      } else {
          deployProject(components);
      }
      
      if (doShellInt) {
          const scriptPath = path.resolve(__dirname);
          // Normalize path for shell usage (forward slashes)
          const projectRoot = path.dirname(scriptPath).split(path.sep).join('/');
          
          const shellContent = `export CLAUDE_PLUGIN_ROOT="${projectRoot}"
alias claude-deploy="node \${CLAUDE_PLUGIN_ROOT}/scripts/deploy.js"
alias claude-explore="node \${CLAUDE_PLUGIN_ROOT}/scripts/explore.js"
alias claude-uninstall="node \${CLAUDE_PLUGIN_ROOT}/scripts/uninstall.js"
alias claude-config="node \${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.js"`;
          
          writeToRc(shellContent);
      }
      
      console.log('\nDeployment Successful!');
      if (doShellInt) {
          console.log('Restart your shell to apply aliases.');
      }
  } catch (err) {
      console.error('Deployment Failed:', err);
  } finally {
      rl.close();
  }
}

main();
