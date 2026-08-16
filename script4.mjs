import fs from 'fs';

const filepath = 'components/Dashboard.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

const refsCode = `
  const lastSavedNotesRef = useRef<Note[]>(notes);
  const lastSavedTasksRef = useRef<Task[]>(tasks);
  const lastSavedEventsRef = useRef<CalendarEvent[]>(events);
  const lastSavedHabitsRef = useRef<Habit[]>(habits);
  const lastSavedMedicinesRef = useRef<Medicine[]>(medicines);
`;

content = content.replace(/(const \[noteSearch, setNoteSearch\] = useState\(""\);)/, refsCode + '\n  $1');

// Replace the prev assignment
content = content.replace(/const saveNotesToLocal = \(data: Note\[\]\) => \{\s*const prev = notes;/g, `const saveNotesToLocal = (data: Note[]) => {
    const prev = lastSavedNotesRef.current;
    lastSavedNotesRef.current = data;`);

content = content.replace(/const saveTasksToLocal = \(data: Task\[\]\) => \{\s*const prev = tasks;/g, `const saveTasksToLocal = (data: Task[]) => {
    const prev = lastSavedTasksRef.current;
    lastSavedTasksRef.current = data;`);

content = content.replace(/const saveEventsToLocal = \(data: CalendarEvent\[\]\) => \{\s*const prev = events;/g, `const saveEventsToLocal = (data: CalendarEvent[]) => {
    const prev = lastSavedEventsRef.current;
    lastSavedEventsRef.current = data;`);

content = content.replace(/const saveHabitsToLocal = \(data: Habit\[\]\) => \{\s*const prev = habits;/g, `const saveHabitsToLocal = (data: Habit[]) => {
    const prev = lastSavedHabitsRef.current;
    lastSavedHabitsRef.current = data;`);

content = content.replace(/const saveMedicinesToLocal = \(data: Medicine\[\]\) => \{\s*const prev = medicines;/g, `const saveMedicinesToLocal = (data: Medicine[]) => {
    const prev = lastSavedMedicinesRef.current;
    lastSavedMedicinesRef.current = data;`);

// ensure initialization syncs the refs
const loadDataPatch = `        if (t !== null) { setTasks(t); lastSavedTasksRef.current = t; localStorage.setItem('sayeban_tasks', JSON.stringify(t)); }
        if (n !== null) { setNotes(n); lastSavedNotesRef.current = n; localStorage.setItem('sayeban_notes', JSON.stringify(n)); }
        if (e !== null) { setEvents(e); lastSavedEventsRef.current = e; localStorage.setItem('sayeban_events', JSON.stringify(e)); }
        if (h !== null) { setHabits(h); lastSavedHabitsRef.current = h; localStorage.setItem('sayeban_habits', JSON.stringify(h)); }
        if (m !== null) { setMedicines(m); lastSavedMedicinesRef.current = m; localStorage.setItem('sayeban_medicines', JSON.stringify(m)); }`;

content = content.replace(/if \(t !== null\) \{ setTasks\(t\); localStorage\.setItem\('sayeban_tasks', JSON\.stringify\(t\)\); \}[\s\S]+?if \(m !== null\) \{ setMedicines\(m\); localStorage\.setItem\('sayeban_medicines', JSON\.stringify\(m\)\); \}/, loadDataPatch);

fs.writeFileSync(filepath, content, 'utf-8');
console.log('Fixed race conditions');
