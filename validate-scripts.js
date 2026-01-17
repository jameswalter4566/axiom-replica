const fs = require('fs');
const content = fs.readFileSync('C:/Users/james/axiom-replica/index.html', 'utf8');

// Extract all script blocks
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const scriptContent = match[1].trim();
  if (scriptContent && !match[0].includes('src=')) {
    try {
      new Function(scriptContent);
      console.log('Script', count, '- OK (length:', scriptContent.length, ')');
    } catch (e) {
      console.log('Script', count, '- ERROR:', e.message);
      // Show first part of script
      console.log('  Start:', scriptContent.substring(0, 100));
    }
  }
}
console.log('Total inline scripts:', count);
