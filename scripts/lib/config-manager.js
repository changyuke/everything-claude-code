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

function loadConfig() {
  const defaults = loadJson(PATHS.default);
  const global = loadJson(PATHS.global);
  const project = loadJson(PATHS.project);
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

module.exports = {
  loadConfig,
  saveConfig,
  getConfigPath,
  validateConfig,
  PATHS,
  PROJECT_ROOT
};
