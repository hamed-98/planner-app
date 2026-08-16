import fs from 'fs';

const filepath = 'components/Dashboard.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

const loadDataPatch = `
        if (t !== null) { 
          if (t.length === 0 && tasks.length > 0) {
            tasks.forEach(x => dbAddTask(x).catch(console.error));
          } else {
            setTasks(t); lastSavedTasksRef.current = t; localStorage.setItem('sayeban_tasks', JSON.stringify(t)); 
          }
        }
        if (n !== null) { 
          if (n.length === 0 && notes.length > 0) {
            notes.forEach(x => dbAddNote(x).catch(console.error));
          } else {
            setNotes(n); lastSavedNotesRef.current = n; localStorage.setItem('sayeban_notes', JSON.stringify(n)); 
          }
        }
        if (e !== null) { 
          if (e.length === 0 && events.length > 0) {
            events.forEach(x => dbAddEvent(x).catch(console.error));
          } else {
            setEvents(e); lastSavedEventsRef.current = e; localStorage.setItem('sayeban_events', JSON.stringify(e)); 
          }
        }
        if (h !== null) { 
          if (h.length === 0 && habits.length > 0) {
            habits.forEach(x => dbAddHabit(x.id, x.name).catch(console.error));
          } else {
            setHabits(h); lastSavedHabitsRef.current = h; localStorage.setItem('sayeban_habits', JSON.stringify(h)); 
          }
        }
        if (m !== null) { 
          if (m.length === 0 && medicines.length > 0) {
            medicines.forEach(x => dbAddMedicine(x).catch(console.error));
          } else {
            setMedicines(m); lastSavedMedicinesRef.current = m; localStorage.setItem('sayeban_medicines', JSON.stringify(m)); 
          }
        }
`;

content = content.replace(/if \(t !== null\) \{ setTasks\(t\); lastSavedTasksRef\.current = t; localStorage\.setItem\('sayeban_tasks', JSON\.stringify\(t\)\); \}[\s\S]+?if \(m !== null\) \{ setMedicines\(m\); lastSavedMedicinesRef\.current = m; localStorage\.setItem\('sayeban_medicines', JSON\.stringify\(m\)\); \}/, loadDataPatch);

fs.writeFileSync(filepath, content, 'utf-8');
console.log('Fixed bootup overwrite');
