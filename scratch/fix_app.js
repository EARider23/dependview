const fs = require('fs');
const path = 'd:/MicroSaas/MicroSaasApps/deped/src/App.jsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

// Line 1865 should be )}
lines[1864] = '                      )}';

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed ternary closure in dashboard view');
