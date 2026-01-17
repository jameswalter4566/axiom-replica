const fs = require('fs');

// Read the local file
let content = fs.readFileSync('C:/Users/james/axiom-replica/index.html', 'utf8');

// Pattern: Find all self.__next_f.push scripts and fix escaping
// The issue is that quotes inside the string after .js" aren't escaped
// e.g., /chunks/file.js",\" should be /chunks/file.js\",\"

// Strategy: Find all occurrences of .js"," and replace with .js\",\"
// Also handle any other unescaped quotes within the push strings

let fixCount = 0;

// Fix pattern: .js",\ should be .js\",\
content = content.replace(/\.js",\\/g, (match) => {
  fixCount++;
  return '.js\\",\\';
});

// Also fix .js"] patterns that might exist
content = content.replace(/\.js"\]/g, (match) => {
  fixCount++;
  return '.js\\"]';
});

// Fix pattern where file extension is followed by unescaped quote
// This handles cases like .css",\ or other extensions
content = content.replace(/\.(js|css|json|svg|png|jpg|ico|woff|woff2)",\\/g, (match, ext) => {
  fixCount++;
  return `.${ext}\\",\\`;
});

console.log('Fixed', fixCount, 'escape sequences');

// Write back
fs.writeFileSync('C:/Users/james/axiom-replica/index.html', content);

console.log('File updated. Testing...');

// Now validate
const scriptRegex = /<script>([^<]*self\.__next_f\.push[^<]*)<\/script>/g;
let match;
let errorCount = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  const scriptContent = match[1];
  try {
    self = { __next_f: [] };
    eval(scriptContent);
  } catch (e) {
    errorCount++;
  }
}
console.log('Scripts with errors after fix:', errorCount);
