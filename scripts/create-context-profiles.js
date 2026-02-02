#!/usr/bin/env node
/**
 * Create Context Profiles - Dynamic System Prompt Injection Setup
 *
 * Based on: The Longform Guide, lines 54-75
 *
 * Creates context profile templates for different work modes.
 * Use with: claude --system-prompt "$(cat ~/.claude/contexts/MODE.md)"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONTEXTS_DIR = path.join(os.homedir(), '.claude', 'contexts');

const profiles = {
  'dev.md': `# Development Mode

## Focus
High-speed feature development with minimal documentation overhead.

## Rules
- Skip explanations unless asked
- Default to Sonnet for coding tasks
- Use TDD workflow automatically
- Auto-run tests after file changes
- Commit often with conventional commits

## Model Selection
- Simple edits: Haiku
- Multi-file features: Sonnet
- Architecture decisions: Opus
`,

  'review.md': `# PR Review Mode

## Focus
Thorough code review with security and quality checks.

## Rules
- Check for OWASP Top 10 vulnerabilities
- Verify test coverage > 80%
- Flag console.log and debug statements
- Review error handling patterns
- Check for hardcoded secrets
- Validate input sanitization

## Model Selection
- Always use Sonnet for reviews
- Escalate to Opus for security-critical code
`,

  'research.md': `# Research/Exploration Mode

## Focus
Deep codebase understanding and external service investigation.

## Rules
- Use Explore agent liberally
- Create comprehensive architecture diagrams
- Document findings in session files
- Fetch llms.txt from documentation sites
- Compile references with source links

## Model Selection
- Exploration: Haiku
- Architecture analysis: Opus
- Documentation writing: Haiku
`,

  'debug.md': `# Debugging Mode

## Focus
Systematic bug investigation and root cause analysis.

## Rules
- Create session file immediately
- Document reproduction steps
- Track attempted solutions (what worked, what didn't)
- Use heap snapshots for memory issues
- Add checkpoint-based verification

## Model Selection
- Simple bugs: Sonnet
- Complex/systemic bugs: Opus
- Memory/performance issues: Opus
`,

  'refactor.md': `# Refactoring Mode

## Focus
Code quality improvement without changing behavior.

## Rules
- Write tests BEFORE refactoring
- Run tests after each change
- Keep changes small and atomic
- Update documentation inline
- Verify no performance regression

## Model Selection
- Single-file refactors: Sonnet
- Multi-module refactors: Opus
- Extract to library: Opus
`
};

function main() {
  // Create contexts directory
  if (!fs.existsSync(CONTEXTS_DIR)) {
    fs.mkdirSync(CONTEXTS_DIR, { recursive: true });
    console.log(`Created: ${CONTEXTS_DIR}`);
  }

  // Write profile templates
  for (const [filename, content] of Object.entries(profiles)) {
    const filePath = path.join(CONTEXTS_DIR, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Created: ${filePath}`);
  }

  console.log('\n✓ Context profiles created!');
  console.log('\nUsage:');
  console.log('  claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"');
  console.log('  claude --system-prompt "$(cat ~/.claude/contexts/review.md)"');
  console.log('  claude --system-prompt "$(cat ~/.claude/contexts/research.md)"');
  console.log('\nAdd to your .bashrc/.zshrc:');
  console.log('  alias claude-dev=\'claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"\'');
  console.log('  alias claude-review=\'claude --system-prompt "$(cat ~/.claude/contexts/review.md)"\'');
  console.log('  alias claude-research=\'claude --system-prompt "$(cat ~/.claude/contexts/research.md)"\'');
  console.log('  alias claude-debug=\'claude --system-prompt "$(cat ~/.claude/contexts/debug.md)"\'');
  console.log('  alias claude-refactor=\'claude --system-prompt "$(cat ~/.claude/contexts/refactor.md)"\'');
}

main();
