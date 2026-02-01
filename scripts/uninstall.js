const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { removeFromRc } = require('./lib/shell-detector');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('=== Everything Claude Code Uninstaller ===');

  // 1. Determine Target
  const args = process.argv.slice(2);
  let targetDir = '';
  let modeLabel = '';

  if (args.includes('--global')) {
    targetDir = path.join(os.homedir(), '.claude');
    modeLabel = 'Global (~/.claude)';
  } else if (args.includes('--project')) {
    targetDir = path.join(process.cwd(), '.claude');
    modeLabel = 'Project (./.claude)';
  } else {
    const modeInput = await question('Uninstall from [Global/Project]? ');
    if (modeInput.trim().toLowerCase().startsWith('g')) {
      targetDir = path.join(os.homedir(), '.claude');
      modeLabel = 'Global (~/.claude)';
    } else {
      targetDir = path.join(process.cwd(), '.claude');
      modeLabel = 'Project (./.claude)';
    }
  }

  console.log(`
Target: ${modeLabel}`);
  console.log('This will remove the following directories from the target if they exist:');
  console.log('- agents/');
  console.log('- skills/');
  console.log('- commands/');
  console.log('- rules/');
  console.log('- hooks/ (if managed by this tool)');
  
  const confirm = await question('\nAre you sure? [y/N]: ');
  if (confirm.trim().toLowerCase() !== 'y') {
    console.log('Aborted.');
    rl.close();
    return;
  }

  // 2. Remove Components (Selective)
  const components = ['agents', 'skills', 'commands', 'rules'];
  const projectRoot = path.resolve(__dirname, '..');
  
  components.forEach(comp => {
    const srcPath = path.join(projectRoot, comp);
    const destPath = path.join(targetDir, comp);
    
    if (fs.existsSync(srcPath) && fs.existsSync(destPath)) {
      console.log(`\nProcessing ${comp}...`);
      const filesToRemove = fs.readdirSync(srcPath);
      
      filesToRemove.forEach(file => {
        const fileInDest = path.join(destPath, file);
        if (fs.existsSync(fileInDest)) {
          try {
            // Check if it's a directory (like some skills)
            const stats = fs.statSync(fileInDest);
            if (stats.isDirectory()) {
              fs.rmSync(fileInDest, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fileInDest);
            }
            console.log(`  ✓ Removed ${file}`);
          } catch (e) {
            console.error(`  ✗ Failed to remove ${file}:`, e.message);
          }
        }
      });

      // Optional: Clean up empty directory
      try {
        if (fs.readdirSync(destPath).length === 0) {
          fs.rmdirSync(destPath);
          console.log(`  (Empty directory ${comp} removed)`);
        }
      } catch (e) {}
    }
  });

  // 3. Remove Shell Integration
  const removeShell = await question('\nRemove Shell Integration (aliases from .bashrc/.zshrc)? [y/N]: ');
  if (removeShell.trim().toLowerCase() === 'y') {
    if (removeFromRc()) {
        console.log('✓ Removed shell configuration');
        console.log('  (Please restart your shell for changes to take effect)');
    } else {
        console.log('- No shell configuration found or failed to remove.');
    }
  }

  console.log('\nUninstallation Complete.');
  rl.close();
}

main();
