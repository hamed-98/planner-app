import fs from 'fs';

const filepath = 'components/Dashboard.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

const debouncerCode = `
const pendingNoteUpdates = new Map<string, NodeJS.Timeout>();
const scheduleNoteUpdate = (id: string, n: Note) => {
  if (pendingNoteUpdates.has(id)) clearTimeout(pendingNoteUpdates.get(id)!);
  pendingNoteUpdates.set(id, setTimeout(() => {
    dbUpdateNote(id, n).catch(console.error);
    pendingNoteUpdates.delete(id);
  }, 1500));
};

const pendingTaskUpdates = new Map<string, NodeJS.Timeout>();
const scheduleTaskUpdate = (id: string, t: Task) => {
  if (pendingTaskUpdates.has(id)) clearTimeout(pendingTaskUpdates.get(id)!);
  pendingTaskUpdates.set(id, setTimeout(() => {
    dbUpdateTask(id, t).catch(console.error);
    pendingTaskUpdates.delete(id);
  }, 1000));
};
`;

content = content.replace(/(export default function Dashboard)/, debouncerCode + '\n$1');

fs.writeFileSync(filepath, content, 'utf-8');
console.log('Added debouncer functions');
