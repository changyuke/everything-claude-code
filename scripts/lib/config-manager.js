const fs = require('fs');
const path = require('path');
const os = require('os');

// Assuming script is in scripts/lib/, project root is two levels up
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const USER_HOME = os.homedir();

const PATHS = {
  default: path.join(PROJECT_ROOT, 'config', 'global-defaults.json'),
  global: path.join(USER_HOME, '.claude', 'deployment', 'config.json'),
  project: path.join(PROJECT_ROOT, 'config', 'deployment.json'),
  local: path.join(PROJECT_ROOT, '.claude-deploy', 'local-config.json')
};

// Custom config path (can be set via setCustomConfigPath or --config CLI arg)
let customConfigPath = null;

/**
 * Set a custom deployment config file path
 * Supports patterns like: deployment_PROJ.json, deployment_frontend.json, etc.
 * @param {string} configPath - Path to custom config file (absolute or relative)
 */
function setCustomConfigPath(configPath) {
  if (!configPath) {
    customConfigPath = null;
    return;
  }

  // Resolve relative paths from PROJECT_ROOT/config/
  if (!path.isAbsolute(configPath)) {
    // Check if file exists in config directory first
    const configDirPath = path.join(PROJECT_ROOT, 'config', configPath);
    if (fs.existsSync(configDirPath)) {
      customConfigPath = configDirPath;
      return;
    }
    // Otherwise resolve from current working directory
    customConfigPath = path.resolve(process.cwd(), configPath);
  } else {
    customConfigPath = configPath;
  }
}

/**
 * Find deployment config files matching pattern: deployment_*.json
 * @returns {Array<{name: string, path: string}>} - List of available project configs
 */
function findProjectConfigs() {
  const configDir = path.join(PROJECT_ROOT, 'config');
  const configs = [];

  if (!fs.existsSync(configDir)) {
    return configs;
  }

  const files = fs.readdirSync(configDir);
  files.forEach(file => {
    // Match deployment.json and deployment_*.json patterns
    const match = file.match(/^deployment(?:_(.+))?\.json$/);
    if (match) {
      const projectName = match[1] || 'default';
      configs.push({
        name: projectName,
        path: path.join(configDir, file),
        filename: file
      });
    }
  });

  return configs;
}

/**
 * Get the active project config path
 * Priority: customConfigPath > PATHS.project
 */
function getProjectConfigPath() {
  return customConfigPath || PATHS.project;
}

function loadJson(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.warn(`Warning: Failed to parse config file at ${filePath}:`, e.message);
      return {};
    }
  }
  return {};
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function getConfigPath(level) {
  return PATHS[level];
}

/**
 * Load configuration with priority merge
 * @param {Object} options - Load options
 * @param {string} options.projectConfig - Override project config path
 * @returns {Object} - Merged configuration
 */
function loadConfig(options = {}) {
  // Allow passing custom project config via options
  if (options.projectConfig) {
    setCustomConfigPath(options.projectConfig);
  }

  const defaults = loadJson(PATHS.default);
  const global = loadJson(PATHS.global);
  const project = loadJson(getProjectConfigPath());
  const local = loadJson(PATHS.local);

  // Priority: Env > Local > Project > Global > Defaults
  // Merging: Default <- Global <- Project <- Local
  let config = mergeDeep({}, defaults);
  config = mergeDeep(config, global);
  config = mergeDeep(config, project);
  config = mergeDeep(config, local);

  if (process.env.CLAUDE_DEPLOY_MODE) {
      config.deploymentMode = process.env.CLAUDE_DEPLOY_MODE;
  }

  // Store the actual project config path used (for reference)
  config._loadedFrom = {
    defaults: PATHS.default,
    global: PATHS.global,
    project: getProjectConfigPath(),
    local: PATHS.local
  };

  return config;
}

function saveConfig(config, level) {
  const filePath = PATHS[level];
  if (!filePath) throw new Error(`Invalid config level: ${level}`);
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
  console.log(`Configuration saved to ${filePath}`);
}

function validateConfig(config) {
  const required = ['deploymentMode', 'components'];
  const missing = required.filter(k => !config[k]);
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  return { valid: true };
}

/**
 * Parse CLI args for --config option
 * @param {string[]} args - Process arguments (usually process.argv.slice(2))
 * @returns {string|null} - Config path if specified
 */
function parseConfigArg(args) {
  for (let i = 0; i < args.length; i++) {
    // Support: --config=path or --config path
    if (args[i].startsWith('--config=')) {
      return args[i].split('=')[1];
    }
    if (args[i] === '--config' && args[i + 1]) {
      return args[i + 1];
    }
    // Support: -c path
    if (args[i] === '-c' && args[i + 1]) {
      return args[i + 1];
    }
  }
  return null;
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfigPath,
  validateConfig,
  setCustomConfigPath,
  findProjectConfigs,
  getProjectConfigPath,
  parseConfigArg,
  PATHS,
  PROJECT_ROOT
};
