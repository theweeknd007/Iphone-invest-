const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // We need to avoid double replacement. 
    // We can use a temporary token replacement.
    content = content.replace(/\btext-sm\b/g, '__TEXT_BASE__');
    content = content.replace(/\btext-xs\b/g, '__TEXT_SM__');
    content = content.replace(/\btext-\[11px\]\b/g, '__TEXT_SM__');
    content = content.replace(/\btext-\[10px\]\b/g, '__TEXT_SM__'); // Bump these up too
    content = content.replace(/\btext-\[9px\]\b/g, '__TEXT_XS__');

    // Now convert tokens to final classes
    content = content.replace(/__TEXT_BASE__/g, 'text-base');
    content = content.replace(/__TEXT_SM__/g, 'text-sm');
    content = content.replace(/__TEXT_XS__/g, 'text-xs');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated: ' + filePath);
    }
  }
});
