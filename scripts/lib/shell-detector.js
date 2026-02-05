const fs = require('fs');
const path = require('path');
const os = require('os');

const BLOCK_START = '# === Everything Claude Code ===';
const BLOCK_END = '# === End Everything Claude Code ===';

/**
 * Detects the current shell and its configuration file path.
 * @returns {{type: string, rcPath: string}}
 */
function detectShell() {
  const platform = os.platform();
  const envShell = process.env.SHELL;

  if (platform === 'win32') {
    // Windows logic
    // Ideally check if running in Git Bash/MinGW
    // For this plan, we prioritize Git Bash's .bashrc for Windows
    return { type: 'bash', rcPath: path.join(os.homedir(), '.bashrc') };
  } else {
    // macOS and Linux
    // Default to zsh if SHELL env contains zsh, otherwise bash
    const isZsh = envShell && envShell.includes('zsh');
    // On macOS, default to zsh if SHELL is not set or ambiguous, as it's the default since Catalina
    if (platform === 'darwin' && !envShell) {
        return { type: 'zsh', rcPath: path.join(os.homedir(), '.zshrc') };
    }
    
    return {
      type: isZsh ? 'zsh' : 'bash',
      rcPath: path.join(os.homedir(), isZsh ? '.zshrc' : '.bashrc')
    };
  }
}

function getRcFilePath() {
  const detected = detectShell();
  return detected ? detected.rcPath : null;
}

function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.bak.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }
  return null;
}

/**
 * Writes content to the shell RC file wrapped in identifier blocks.
 * @param {string} content - The shell script content to write.
 * @returns {boolean} - True if successful.
 */
function writeToRc(content) {
  const detected = detectShell();
  const rcPath = detected.rcPath;
  
  if (!rcPath) {
    console.error('Could not detect shell RC path.');
    return false;
  }

  // Ensure directory exists (rarely needed for homedir but good practice)
  const rcDir = path.dirname(rcPath);
  if (!fs.existsSync(rcDir)) {
      fs.mkdirSync(rcDir, { recursive: true });
  }

  createBackup(rcPath);

  let fileContent = '';
  if (fs.existsSync(rcPath)) {
    fileContent = fs.readFileSync(rcPath, 'utf8');
  }

  // Ensure content ends with newline if it doesn't
  const blockContent = content.endsWith('\n') ? content : content + '\n';
  const block = `${BLOCK_START}\n${blockContent}${BLOCK_END}`;
  
  // Escape special regex characters in BLOCK_START/END if necessary (they are mostly safe here)
  const regexStart = BLOCK_START.replace(/[.*+?^${}()|[\\]/g, '\\$&');
  const regexEnd = BLOCK_END.replace(/[.*+?^${}()|[\\]/g, '\\$&');
  const regex = new RegExp(`${regexStart}[\\s\\S]*?${regexEnd}`);
  const newContent = fileContent.replace(regex, block);

  if (newContent !== fileContent) {
    fileContent = newContent;
    console.log(`Updated configuration in ${rcPath}`);
  } else {
    // Append with a newline if file is not empty and doesn't end with one
    if (fileContent && !fileContent.endsWith('\n')) {
        fileContent += '\n';
    }
    fileContent += `${block}\n`;
    console.log(`Appended configuration to ${rcPath}`);
  }

  try {
    fs.writeFileSync(rcPath, fileContent, 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing to ${rcPath}:`, err);
    return false;
  }
}

function removeFromRc() {
  const detected = detectShell();
  const rcPath = detected.rcPath;
  
  if (!rcPath || !fs.existsSync(rcPath)) return false;

  createBackup(rcPath);
  let fileContent = fs.readFileSync(rcPath, 'utf8');
  
  const regexStart = BLOCK_START.replace(/[.*+?^${}()|[\\]/g, '\\$&');
  const regexEnd = BLOCK_END.replace(/[.*+?^${}()|[\\]/g, '\\$&');
  const regex = new RegExp(`\\n?${regexStart}[\\s\\S]*?${regexEnd}\\n?`);
  const newContent = fileContent.replace(regex, '\n');

  if (newContent !== fileContent) {
    fileContent = newContent;
    // Clean up potential double newlines
    fileContent = fileContent.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(rcPath, fileContent.trim() + '\n', 'utf8');
    console.log(`Removed configuration from ${rcPath}`);
    return true;
  }
  return false;
}

module.exports = {
  detectShell,
  getRcFilePath,
  writeToRc,
  removeFromRc
};
