const fs = require('fs');
const { execSync } = require('child_process');

// Get original content from git
const original = execSync('git show HEAD:src/views/AgentWorkView.vue', { maxBuffer: 10*1024*1024 });
let content = original.toString('utf8');

// Find where style tag starts
const styleIdx = content.indexOf('<style scoped');
let template = content.substring(0, styleIdx);

// Remove the chat-right div block
const startMarker = '<div class="chat-right">';
const startIdx = template.indexOf(startMarker);
if (startIdx === -1) { console.error('chat-right not found'); process.exit(1); }

let depth = 0;
let i = startIdx;
let endIdx = -1;
while (i < template.length) {
  const openIdx = template.indexOf('<div', i);
  const closeIdx = template.indexOf('</div>', i);
  if (closeIdx === -1) break;
  if (openIdx !== -1 && openIdx < closeIdx) {
    depth++;
    i = openIdx + 4;
  } else {
    depth--;
    if (depth === 0) {
      endIdx = closeIdx + 6;
      break;
    }
    i = closeIdx + 6;
  }
}
if (endIdx === -1) { console.error('Could not find end of chat-right div'); process.exit(1); }

const cleanTemplate = template.substring(0, startIdx) + template.substring(endIdx);
console.log(`Removed chat-right block (${endIdx - startIdx} chars)`);

// Read new style
const newStyle = fs.readFileSync('src/views/AgentWorkView_new_style.scss', 'utf8');

// Compose final file
const finalContent = cleanTemplate + '<style scoped lang="scss">\n' + newStyle + '\n</style>\n';
fs.writeFileSync('src/views/AgentWorkView.vue', finalContent, 'utf8');
console.log('Done! Written AgentWorkView.vue, size:', finalContent.length);
