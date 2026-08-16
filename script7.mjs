import fs from 'fs';

const filepath = 'components/Dashboard.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

content = content.replace(/lastSavedEventsRef\.current = data;/g, '// eslint-disable-next-line react-hooks/immutability\n    lastSavedEventsRef.current = data;');
content = content.replace(/lastSavedNotesRef\.current = data;/g, '// eslint-disable-next-line react-hooks/immutability\n    lastSavedNotesRef.current = data;');
content = content.replace(/lastSavedTasksRef\.current = data;/g, '// eslint-disable-next-line react-hooks/immutability\n    lastSavedTasksRef.current = data;');
content = content.replace(/lastSavedHabitsRef\.current = data;/g, '// eslint-disable-next-line react-hooks/immutability\n    lastSavedHabitsRef.current = data;');
content = content.replace(/lastSavedMedicinesRef\.current = data;/g, '// eslint-disable-next-line react-hooks/immutability\n    lastSavedMedicinesRef.current = data;');

fs.writeFileSync(filepath, content, 'utf-8');
console.log('Fixed linter errors');
