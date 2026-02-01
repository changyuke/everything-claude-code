const { execSync, spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

const UPSTREAM_URL = 'https://github.com/affaan-m/everything-claude-code.git';
const MAIN_BRANCH = 'main'; // Upstream main branch

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

function printHeader(text) {
  console.log(`\n\x1b[36m=== ${text} ===\x1b[0m`);
}

async function main() {
  printHeader('Everything Claude Code - Upstream Sync');

  // 1. Check Git Status
  try {
    const status = runGit('git status --porcelain');
    if (status) {
      console.warn('\x1b[33mWarning: You have uncommitted changes. It is recommended to commit or stash them before syncing.\x1b[0m');
      const proceed = await question('Continue anyway? [y/N]: ');
      if (proceed.toLowerCase() !== 'y') {
        rl.close();
        return;
      }
    }
  } catch (e) {
    console.error('Error: Not a git repository?');
    rl.close();
    return;
  }

  // 2. Configure Upstream
  console.log('Checking upstream remote...');
  const remotes = runGit('git remote -v');
  if (!remotes.includes('upstream')) {
    console.log(`Adding upstream remote: ${UPSTREAM_URL}`);
    runGit(`git remote add upstream ${UPSTREAM_URL}`);
  } else {
    console.log('Upstream remote already configured.');
  }

  // 3. Fetch Updates
  console.log('\nFetching updates from upstream...');
  runGit('git fetch upstream');

  // 4. Check for Divergence
  const localHead = runGit('git rev-parse HEAD');
  const upstreamHead = runGit(`git rev-parse upstream/${MAIN_BRANCH}`);

  if (localHead === upstreamHead) {
    console.log('\n\x1b[32mAlready up to date with upstream.\x1b[0m');
    rl.close();
    return;
  }

  // 5. List New Commits
  printHeader('New Commits from Upstream');
  try {
    const log = runGit(`git log --oneline --graph --decorate HEAD..upstream/${MAIN_BRANCH}`);
    console.log(log);
  } catch (e) {
    console.log('(No clear history path found, possibly divergent branches)');
  }

  // 6. Interactive Sync Options
  printHeader('Sync Options');
  console.log('1. \x1b[1mMerge\x1b[0m (Standard merge, requires manual conflict resolution if any)');
  console.log('2. \x1b[1mRebase\x1b[0m (Replay your changes on top of upstream - cleaner history)');
  console.log('3. \x1b[1mReview Diff\x1b[0m (See changed files first)');
  console.log('4. Cancel');

  const choice = await question('\nChoose an option [1-4]: ');

  switch (choice.trim()) {
    case '1':
      console.log('\nRunning: git merge upstream/main');
      try {
        // Inherit stdio to let git merge show its output directly
        const child = spawn('git', ['merge', `upstream/${MAIN_BRANCH}`], { stdio: 'inherit' });
        child.on('close', (code) => {
          if (code === 0) console.log('\n\x1b[32mMerge successful!\x1b[0m');
          else console.log('\n\x1b[31mMerge encountered conflicts. Please resolve them manually.\x1b[0m');
          rl.close();
        });
      } catch (e) {
        console.error('Merge failed to start.');
        rl.close();
      }
      break;

    case '2':
      console.log('\nRunning: git rebase upstream/main');
      try {
        const child = spawn('git', ['rebase', `upstream/${MAIN_BRANCH}`], { stdio: 'inherit' });
        child.on('close', (code) => {
          if (code === 0) console.log('\n\x1b[32mRebase successful!\x1b[0m');
          else console.log('\n\x1b[31mRebase encountered conflicts. Please resolve them manually.\x1b[0m');
          rl.close();
        });
      } catch (e) {
        rl.close();
      }
      break;

    case '3':
      console.log('\nShowing diff summary...');
      const diffStat = runGit(`git diff --stat HEAD...upstream/${MAIN_BRANCH}`);
      console.log(diffStat);
      console.log('\nTo see full diff, run: git diff HEAD...upstream/main');
      rl.close();
      break;

    default:
      console.log('Cancelled.');
      rl.close();
      break;
  }
}

// Handle the case where the user simply presses enter for cases
main().catch(e => {
  console.error(e);
  rl.close();
});
