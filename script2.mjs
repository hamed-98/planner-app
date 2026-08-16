import fs from 'fs';

const filepath = 'components/Dashboard.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

// Tasks sync
content = content.replace(/deleteTask\(id\)\.catch\(console\.error\)/, 'dbDeleteTask(id).catch(console.error)');
content = content.replace(/addTask\(t\)\.catch\(console\.error\)/, 'dbAddTask(t).catch(console.error)');
content = content.replace(/updateTask\(id, t\)\.catch\(console\.error\)/, 'dbUpdateTask(id, t).catch(console.error)');

// Notes sync
content = content.replace(/deleteNote\(id\)\.catch\(console\.error\)/, 'dbDeleteNote(id).catch(console.error)');
content = content.replace(/addNote\(n\)\.catch\(console\.error\)/, 'dbAddNote(n).catch(console.error)');
content = content.replace(/updateNote\(id, n\)\.catch\(console\.error\)/, 'dbUpdateNote(id, n).catch(console.error)');

// Events sync
content = content.replace(/deleteEvent\(id\)\.catch\(console\.error\)/, 'dbDeleteEvent(id).catch(console.error)');
content = content.replace(/addEvent\(x\)\.catch\(console\.error\)/, 'dbAddEvent(x).catch(console.error)');

// Habits sync
content = content.replace(/deleteHabitDb\(id\)\.catch\(console\.error\)/, 'dbDeleteHabit(id).catch(console.error)');
content = content.replace(/addHabit\(x\.id, x\.name\)\.catch\(console\.error\)/, 'dbAddHabit(x.id, x.name).catch(console.error)');

// Medicines sync
content = content.replace(/deleteMedicineDb\(id\)\.catch\(console\.error\)/, 'dbDeleteMedicine(id).catch(console.error)');
content = content.replace(/addMedicine\(x\)\.catch\(console\.error\)/, 'dbAddMedicine(x).catch(console.error)');

fs.writeFileSync(filepath, content, 'utf-8');
console.log('Fixed aliases');
