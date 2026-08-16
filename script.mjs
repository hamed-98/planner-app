import fs from 'fs';

// 1. Fix Supabase Getters to return null on error
const dir = 'lib/supabase/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'client.ts');
for (const file of files) {
  let content = fs.readFileSync(dir + file, 'utf-8');
  content = content.replace(/if \((habitsError \|\| logsError|error)\) \{\s*console\.error\([^)]+\);\s*return \[\];\s*\}/g, (match, p1) => {
    return `if (${p1}) {\n    console.error('Error fetching', ${p1});\n    return null;\n  }`;
  });
  fs.writeFileSync(dir + file, content);
}

// 2. Fix Dashboard.tsx to use local storage
const filepath = 'components/Dashboard.tsx';
let dContent = fs.readFileSync(filepath, 'utf-8');

// Add localStorage save logic back
dContent = dContent.replace(/setNotes\(data\);/, "setNotes(data);\n    localStorage.setItem('sayeban_notes', JSON.stringify(data));");
dContent = dContent.replace(/setEvents\(data\);/, "setEvents(data);\n    localStorage.setItem('sayeban_events', JSON.stringify(data));");
dContent = dContent.replace(/setHabits\(data\);/, "setHabits(data);\n    localStorage.setItem('sayeban_habits', JSON.stringify(data));");
dContent = dContent.replace(/setMedicines\(data\);/, "setMedicines(data);\n    localStorage.setItem('sayeban_medicines', JSON.stringify(data));");
dContent = dContent.replace(/setGlobalHealth\(data\);/, "setGlobalHealth(data);\n    localStorage.setItem('sayeban_health', JSON.stringify(data));");
dContent = dContent.replace(/setDailyHealthData\(newData\);/, "setDailyHealthData(newData);\n    localStorage.setItem('sayeban_daily_health', JSON.stringify(newData));");

// Provide local initial state inside initializers
dContent = dContent.replace(/const \[events, setEvents\] = useState<CalendarEvent\[\]>\(\[\]\);/, `const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_events');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });`);

dContent = dContent.replace(/const \[notes, setNotes\] = useState<Note\[\]>\(\[\]\);/, `const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_notes');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });`);

dContent = dContent.replace(/const \[tasks, setTasks\] = useState<Task\[\]>\(\[\]\);/, `const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_tasks');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });`);

dContent = dContent.replace(/const \[habits, setHabits\] = useState<Habit\[\]>\(\[\]\);/, `const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_habits');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });`);

dContent = dContent.replace(/const \[medicines, setMedicines\] = useState<Medicine\[\]>\(\[\]\);/, `const [medicines, setMedicines] = useState<Medicine[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_medicines');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });`);

dContent = dContent.replace(/const \[globalHealth, setGlobalHealth\] = useState<HealthMetrics>\(\{\s*waterToday: 0,\s*sleepHours: 7,\s*sleepQuality: 'good',\s*moodScore: 4,\s*weight: 72,\s*workoutType: 'پیاده‌روی',\s*workoutMin: 0\s*\}\);/, `const [globalHealth, setGlobalHealth] = useState<HealthMetrics>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_health');
      if (saved) return JSON.parse(saved);
    }
    return { waterToday: 0, sleepHours: 7, sleepQuality: 'good', moodScore: 4, weight: 72, workoutType: 'پیاده‌روی', workoutMin: 0 };
  });`);

dContent = dContent.replace(/const \[dailyHealthData, setDailyHealthData\] = useState<Record<string, any>>\(\{\}\);/, `const [dailyHealthData, setDailyHealthData] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_daily_health');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });`);


// Fix loadData to respect null
const oldLoadData = `        const [t, n, e, h, m, hl, p] = await Promise.all([
          getTasks(), getNotes(), getEvents(), getHabits(), getMedicines(), getHealthLogs(), getProfile()
        ]);
        setTasks(t);
        setNotes(n);
        setEvents(e);
        setHabits(h);
        setMedicines(m);`;
        
const newLoadData = `        const [t, n, e, h, m, hl, p] = await Promise.all([
          getTasks(), getNotes(), getEvents(), getHabits(), getMedicines(), getHealthLogs(), getProfile()
        ]);
        if (t !== null) { setTasks(t); localStorage.setItem('sayeban_tasks', JSON.stringify(t)); }
        if (n !== null) { setNotes(n); localStorage.setItem('sayeban_notes', JSON.stringify(n)); }
        if (e !== null) { setEvents(e); localStorage.setItem('sayeban_events', JSON.stringify(e)); }
        if (h !== null) { setHabits(h); localStorage.setItem('sayeban_habits', JSON.stringify(h)); }
        if (m !== null) { setMedicines(m); localStorage.setItem('sayeban_medicines', JSON.stringify(m)); }`;
        
dContent = dContent.replace(oldLoadData, newLoadData);

// Fix health log null check
const newLoadHealth = `        if (hl !== null) {
          const daily: Record<string, any> = {};
          for (const log of hl) {
            const sq = log.sleep_quality === 1 ? 'poor' : log.sleep_quality === 2 ? 'fair' : log.sleep_quality === 3 ? 'good' : 'excellent';
            daily[log.log_date] = {
              waterToday: log.water_ml || 0,
              sleepHours: log.sleep_hours || 0,
              sleepQuality: sq,
              moodScore: log.mood || 3,
              weight: log.weight_kg || 0
            };
          }
          setDailyHealthData(prev => {
            const updated = { ...prev, ...daily };
            localStorage.setItem('sayeban_daily_health', JSON.stringify(updated));
            return updated;
          });
        }`;

dContent = dContent.replace(/const daily: Record<string, any> = \{\};\s*for \(const log of hl\) \{[\s\S]+?\}\s*setDailyHealthData\(daily\);/, newLoadHealth);

fs.writeFileSync(filepath, dContent, 'utf-8');
console.log('Fixed Dashboard');
