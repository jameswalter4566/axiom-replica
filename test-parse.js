// Try to parse the problematic script directly
const testScript = `self.__next_f.push([1,"1:\\"$Sreact.fragment\\"\\n16:I[563491,[\\"/_next/static/chunks/9fb09e7ff8c8d3d5.js\\",\\"/_next/static/chunks/46bba9b26757d34f.js\\",\\"/_next/static/chunks/6bd1b6f53d1e3b5b.js\\"],\\"default\\"]\\n17:I[92825,[\\"/_next/static/chunks/95ef5262f56ff3ee.js\\",\\"/_next/static/chunks/50489a1588464a71.js\\"],\\"ClientSegmentRoot\\"]\\n"])`;

try {
  new Function(testScript);
  console.log('Test script parses OK');
} catch (e) {
  console.log('Test script error:', e.message);
}

// Now test the actual script from the file
const fs = require('fs');
const content = fs.readFileSync('C:/Users/james/axiom-replica/index.html', 'utf8');

const scriptRegex = /<script>self\.__next_f\.push\(\[1,"([^]*?)"\]\)<\/script>/g;
let match;
while ((match = scriptRegex.exec(content)) !== null) {
  const innerContent = match[1];
  console.log('\nFound push script, inner length:', innerContent.length);

  // Check if the backslashes are single or double
  const doubleBackslash = innerContent.includes('\\\\');
  const singleBackslash = innerContent.includes('\\') && !doubleBackslash;
  console.log('Has double backslash:', doubleBackslash);
  console.log('Has single backslash:', singleBackslash);

  // Show the raw bytes of the first escape sequence
  const escIdx = innerContent.indexOf('\\');
  if (escIdx >= 0) {
    console.log('First backslash at', escIdx);
    console.log('Chars around it:', JSON.stringify(innerContent.substring(escIdx - 2, escIdx + 5)));
    console.log('Char codes:', [...innerContent.substring(escIdx - 2, escIdx + 5)].map(c => c.charCodeAt(0)));
  }
  break;
}
