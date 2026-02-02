#!/usr/bin/env node
/**
 * Git Worktree Manager - Parallel Claude Instance Support
 *
 * Based on: The Longform Guide, lines 192-204
 *
 * Manages git worktrees for parallel Claude Code instances.
 * Each worktree gets isolated workspace without conflicts.
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

function runGit(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();
  } catch (e) {
    if (options.ignoreError) return null;
    throw new Error(`Git command failed: ${command}\n${e.message}`);
  }
}

function listWorktrees() {
  const output = runGit('git worktree list --porcelain');
  const worktrees = [];
  const lines = output.split('\n');

  let current = {};
  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      if (current.path) worktrees.push(current);
      current = { path: line.substring(9) };
    } else if (line.startsWith('branch ')) {
      current.branch = line.substring(7).replace('refs/heads/', '');
    } else if (line === 'bare') {
      current.bare = true;
    }
  }
  if (current.path) worktrees.push(current);

  return worktrees;
}

async function createWorktree() {
  console.log('\n=== Create New Worktree ===\n');

  const branchName = await question('Branch name (e.g., feature-auth): ');
  if (!branchName) {
    console.log('Cancelled.');
    return;
  }

  const projectRoot = process.cwd();
  const projectName = path.basename(projectRoot);
  const worktreePath = path.join(path.dirname(projectRoot), `${projectName}-${branchName}`);

  console.log(`\nWorktree path: ${worktreePath}`);
  const confirm = await question('Create? [y/N]: ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }

  try {
    // Create branch and worktree
    runGit(`git worktree add "${worktreePath}" -b ${branchName}`);
    console.log(`\n✓ Worktree created: ${worktreePath}`);
    console.log(`✓ Branch created: ${branchName}`);
    console.log('\nNext steps:');
    console.log(`  cd "${worktreePath}"`);
    console.log(`  claude`);
    console.log(`  /rename ${branchName}`);
  } catch (e) {
    console.error('Failed to create worktree:', e.message);
  }
}

async function removeWorktree() {
  const worktrees = listWorktrees().filter(w => !w.bare);

  if (worktrees.length <= 1) {
    console.log('No additional worktrees to remove.');
    return;
  }

  console.log('\n=== Remove Worktree ===\n');
  worktrees.forEach((w, i) => {
    console.log(`${i + 1}. ${w.branch || '(detached)'} - ${w.path}`);
  });

  const choice = await question('\nSelect worktree to remove [1-N]: ');
  const index = parseInt(choice) - 1;

  if (index < 0 || index >= worktrees.length) {
    console.log('Invalid selection.');
    return;
  }

  const selected = worktrees[index];
  console.log(`\nRemoving: ${selected.path}`);
  const confirm = await question('Are you sure? [y/N]: ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }

  try {
    runGit(`git worktree remove "${selected.path}"`);
    console.log('✓ Worktree removed');

    if (selected.branch) {
      const deleteBranch = await question(`Delete branch "${selected.branch}"? [y/N]: `);
      if (deleteBranch.toLowerCase() === 'y') {
        runGit(`git branch -D ${selected.branch}`);
        console.log('✓ Branch deleted');
      }
    }
  } catch (e) {
    console.error('Failed to remove worktree:', e.message);
  }
}

function showWorktrees() {
  console.log('\n=== Git Worktrees ===\n');
  const worktrees = listWorktrees();

  worktrees.forEach((w, i) => {
    const branch = w.branch || '(detached)';
    const marker = w.bare ? '[bare]' : '';
    console.log(`${i + 1}. ${branch.padEnd(30)} ${w.path} ${marker}`);
  });

  console.log(`\nTotal: ${worktrees.length} worktree(s)`);
}

async function main() {
  console.log('Git Worktree Manager');
  console.log('-------------------');

  // Check if in git repo
  try {
    runGit('git rev-parse --git-dir');
  } catch (e) {
    console.error('Error: Not a git repository');
    rl.close();
    return;
  }

  console.log('\n1. List worktrees');
  console.log('2. Create new worktree');
  console.log('3. Remove worktree');
  console.log('4. Exit');

  const choice = await question('\nChoose an option [1-4]: ');

  switch (choice.trim()) {
    case '1':
      showWorktrees();
      break;
    case '2':
      await createWorktree();
      break;
    case '3':
      await removeWorktree();
      break;
    default:
      console.log('Exiting.');
  }

  rl.close();
}

main().catch(e => {
  console.error(e);
  rl.close();
});
