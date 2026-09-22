const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/DELL/Downloads/trading/admin-panel/src';

const replacements = {
  '#0A0E17': '#0f172a', // dark slate background
  '#131A2E': '#1e293b', // slate card background
  '#00D395': '#8b5cf6', // purple primary
  '#00B884': '#7c3aed', // purple primary dark
  '#FF6B6B': '#f43f5e', // rose error
  '#E05555': '#e11d48', // rose error dark
};

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync(dir, function(filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        for (const [key, value] of Object.entries(replacements)) {
            newContent = newContent.split(key).join(value);
        }
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated ' + filePath);
        }
    }
});
