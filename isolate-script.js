const fs = require('fs');

// Read the local file
const content = fs.readFileSync('C:/Users/james/axiom-replica/index.html', 'utf8');

// Find all script tags and extract their full content
const scriptRegex = /<script>([^<]*self\.__next_f\.push[^<]*)<\/script>/g;
let match;
let count = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  if (count === 1) {
    const scriptContent = match[1];
    console.log('Script content length:', scriptContent.length);
    console.log('\nFirst 200 chars:');
    console.log(scriptContent.substring(0, 200));
    console.log('\n--- Testing with eval ---');
    try {
      // Set up the global
      self = { __next_f: [] };
      eval(scriptContent);
      console.log('EVAL SUCCESS! Array has', self.__next_f.length, 'items');
    } catch (e) {
      console.log('EVAL FAILED:', e.message);
      // Find the position
      const posMatch = e.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        console.log('Error at position', pos);
        console.log('Context around error:');
        console.log(scriptContent.substring(Math.max(0, pos - 20), pos + 20));
        console.log('Char codes around error:');
        console.log([...scriptContent.substring(Math.max(0, pos - 5), pos + 5)].map(c => c.charCodeAt(0)));
      }
    }
    break;
  }
}
