const fs = require('fs');

// Read the local file
const localContent = fs.readFileSync('C:/Users/james/axiom-replica/index.html', 'utf8');

// Extract a problematic script
const scriptMatch = localContent.match(/<script>self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)<\/script>/);
if (scriptMatch) {
  const innerContent = scriptMatch[1];
  console.log('Local file - First 100 chars of inner content:');
  console.log(JSON.stringify(innerContent.substring(0, 100)));
  console.log('\nByte codes:');
  console.log([...innerContent.substring(0, 50)].map(c => c.charCodeAt(0)));

  // Check for actual newlines vs escaped newlines
  const hasRealNewline = innerContent.includes('\n');
  const hasEscapedNewline = innerContent.includes('\\n');
  console.log('\nHas real newline char:', hasRealNewline);
  console.log('Has \\n literal:', hasEscapedNewline);
} else {
  console.log('No script found');
}
