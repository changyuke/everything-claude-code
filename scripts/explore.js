const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function getDescription(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Try to parse YAML frontmatter for 'description'
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      const yaml = match[1];
      const descMatch = yaml.match(/^description:\s*(.*)$/m);
      if (descMatch && descMatch[1]) {
        return descMatch[1].trim().replace(/^["']|["']$/g, ''); // Remove potential quotes
      }
    }

    // 2. Fallback: Find the first meaningful line (skip frontmatter and headers)
    const lines = content.replace(frontmatterRegex, '').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
         return trimmed;
      }
    }
    return '(No description found)';
  } catch (e) {
    return '(Error reading file)';
  }
}

function scanDir(dirName, description) {
  const dirPath = path.join(ROOT_DIR, dirName);
  if (!fs.existsSync(dirPath)) return;

  console.log(`\n=== ${description} (${dirName}/) ===\n`);

  const items = fs.readdirSync(dirPath).sort();
  
  items.forEach(item => {
    // Skip hidden files
    if (item.startsWith('.')) return;

    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);
    let name = item;
    let desc = '';

    if (stats.isDirectory()) {
      // Look for SKILL.md or README.md inside folders
      const skillPath = path.join(fullPath, 'SKILL.md');
      const readmePath = path.join(fullPath, 'README.md');
      
      if (fs.existsSync(skillPath)) {
        desc = getDescription(skillPath);
      } else if (fs.existsSync(readmePath)) {
        desc = getDescription(readmePath);
      } else {
        desc = '(Container folder)';
      }
      name = `${item}/`;
    } else {
        if (!item.endsWith('.md')) return;
        desc = getDescription(fullPath);
        name = item.replace(/\.md$/, '');
    }

    // Formatting: Adjust padding and truncate long descriptions
    const displayName = name.padEnd(25);
    const displayDesc = desc.length > 80 ? desc.substring(0, 77) + '...' : desc;
    console.log(`- ${displayName} : ${displayDesc}`);
  });
}

function main() {
    console.log('Everything Claude Code - Component Explorer');
    console.log('-------------------------------------------');
    
    scanDir('agents', 'AGENTS (Sub-assistants for specific tasks)');
    scanDir('skills', 'SKILLS (Reusable workflows)');
    scanDir('commands', 'COMMANDS (Quick shortcuts)');
}

main();
