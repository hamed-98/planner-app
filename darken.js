const fs = require('fs');
let code = fs.readFileSync('components/Dashboard.tsx', 'utf8');

const replacements = {
  'bg-white': 'bg-white dark:bg-slate-900',
  'bg-slate-50': 'bg-slate-50 dark:bg-slate-950',
  'bg-slate-100': 'bg-slate-100 dark:bg-slate-800',
  'bg-slate-200': 'bg-slate-200 dark:bg-slate-700',
  'text-slate-950': 'text-slate-950 dark:text-slate-50',
  'text-slate-900': 'text-slate-900 dark:text-slate-100',
  'text-slate-800': 'text-slate-800 dark:text-slate-200',
  'text-slate-700': 'text-slate-700 dark:text-slate-300',
  'text-slate-600': 'text-slate-600 dark:text-slate-400',
  'text-slate-500': 'text-slate-500 dark:text-slate-400',
  'border-slate-100': 'border-slate-100 dark:border-slate-800',
  'border-slate-200': 'border-slate-200 dark:border-slate-700',
  'border-slate-300': 'border-slate-300 dark:border-slate-600',
};

for (const [light, dark] of Object.entries(replacements)) {
  // Replace only if not followed by " dark:"
  const regex = new RegExp(`\\b${light}\\b(?!\\s*dark:)`, 'g');
  code = code.replace(regex, dark);
}

fs.writeFileSync('components/Dashboard.tsx', code);
console.log('Done');
