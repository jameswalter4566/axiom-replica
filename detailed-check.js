const fs = require('fs');

// Read the local file
const content = fs.readFileSync('C:/Users/james/axiom-replica/index.html', 'utf8');

// Find the script
const scriptRegex = /<script>([^<]*self\.__next_f\.push[^<]*)<\/script>/;
const match = content.match(scriptRegex);

if (match) {
  const scriptContent = match[1];

  // Parse to find where the string literal starts and ends
  console.log('Full script content:');
  console.log(scriptContent);
  console.log('\n---\nChar by char analysis of first 100:');

  for (let i = 0; i < Math.min(100, scriptContent.length); i++) {
    const char = scriptContent[i];
    const code = char.charCodeAt(0);
    if (code === 34) console.log(`Position ${i}: QUOTE (${code})`);
    else if (code === 92) console.log(`Position ${i}: BACKSLASH (${code})`);
  }
}
