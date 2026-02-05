const fs = require('fs');
const path = require('path');
const os = require('os');
const { PROJECT_ROOT } = require('./config-manager');

const COMPONENT_DIRS = ['agents', 'skills', 'commands', 'rules', 'hooks', 'contexts'];

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

function deploy(targetDir, components) {
  console.log(`Deploying to ${targetDir}...`);
  
  if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const type of COMPONENT_DIRS) {
      const componentConfig = components[type];
      
      // Check if enabled (default to true if config object exists but enabled property is missing, false if entire key missing is handled by caller usually, but here we check existence)
      if (componentConfig && componentConfig.enabled !== false) {
          const srcPath = path.join(PROJECT_ROOT, type);
          const destPath = path.join(targetDir, type);
          
          if (fs.existsSync(srcPath)) {
              console.log(`Installing ${type}...`);
              
              const items = componentConfig.items;
              const installAll = !items || (Array.isArray(items) && items.includes('all'));
              
              if (installAll) {
                  copyRecursiveSync(srcPath, destPath);
              } else if (Array.isArray(items)) {
                  items.forEach(item => {
                      const itemSrc = path.join(srcPath, item);
                      const itemSrcMd = path.join(srcPath, item + '.md');
                      const itemSrcJson = path.join(srcPath, item + '.json');
                      const itemSrcJs = path.join(srcPath, item + '.js');
                      
                      if (fs.existsSync(itemSrc)) {
                          copyRecursiveSync(itemSrc, path.join(destPath, item));
                      } else if (fs.existsSync(itemSrcMd)) {
                           copyRecursiveSync(itemSrcMd, path.join(destPath, item + '.md'));
                      } else if (fs.existsSync(itemSrcJson)) {
                           copyRecursiveSync(itemSrcJson, path.join(destPath, item + '.json'));
                      } else if (fs.existsSync(itemSrcJs)) {
                           copyRecursiveSync(itemSrcJs, path.join(destPath, item + '.js'));
                      } else {
                          console.warn(`Warning: Component item ${item} not found in ${srcPath}`);
                      }
                  });
              }
          }
      }
  }
  
  console.log('Deployment complete.');
  return true;
}

function deployGlobal(components) {
    const target = path.join(os.homedir(), '.claude');
    return deploy(target, components);
}

function deployProject(components) {
    const target = path.join(process.cwd(), '.claude');
    return deploy(target, components);
}

module.exports = {
    deployGlobal,
    deployProject,
    COMPONENT_DIRS
};
