const fs = require('fs');
const content = fs.readFileSync('C:/Users/james/axiom-replica/index.html', 'utf8');

// Find first problematic script
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const scriptContent = match[1].trim();
  if (scriptContent && scriptContent.startsWith('self.__next_f.push')) {
    console.log('Script', count);
    console.log('Full content:');
    console.log(scriptContent.substring(0, 500));
    console.log('\n---');

    // Look for the specific issue
    // The string inside push() should be valid
    const pushMatch = scriptContent.match(/self\.__next_f\.push\(\[1,"(.*)"\]\)/s);
    if (pushMatch) {
      const innerString = pushMatch[1];
      console.log('Inner string first 200 chars:', innerString.substring(0, 200));

      // Check for unescaped special characters
      for (let i = 0; i < Math.min(innerString.length, 1000); i++) {
        const char = innerString[i];
        const code = char.charCodeAt(0);
        if (code < 32 && code !== 10 && code !== 13 && code !== 9) {
          console.log('Found control char at', i, ':', code);
        }
      }
    }
    break;
  }
}
