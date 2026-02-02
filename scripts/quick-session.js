#!/usr/bin/env node
/**
 * Quick Session File - 极简会话记录
 *
 * 不需要选模板，直接记录要点
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

function getDateString() {
  return new Date().toISOString().split('T')[0];
}

function getTimeString() {
  return new Date().toTimeString().split(' ')[0];
}

async function main() {
  const title = await question('这次要做什么？(一句话): ');

  if (!title) {
    console.log('已取消');
    rl.close();
    return;
  }

  const today = getDateString();
  const time = getTimeString();

  const content = `# ${title}
**日期**: ${today} ${time}

## 做了什么
-

## 什么有效 ✓
-

## 什么无效 ✗
-

## 下次继续
-

## 相关文件
\`\`\`
[需要加载的文件路径]
\`\`\`
`;

  // 保存到 .claude/sessions/
  const sessionsDir = path.join(process.cwd(), '.claude', 'sessions');
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  const filename = `${today}-${title.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}.md`;
  const filepath = path.join(sessionsDir, filename);

  fs.writeFileSync(filepath, content, 'utf8');

  console.log(`\n✓ 会话文件已创建: ${filepath}`);
  console.log('\n使用方法:');
  console.log(`  claude`);
  console.log(`  @${filepath}`);
  console.log('\n工作结束后记得更新这个文件，下次可以直接续上。');

  rl.close();
}

main();
