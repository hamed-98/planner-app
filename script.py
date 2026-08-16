import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add imports at the beginning
    imports = """import { getTasks, addTask, updateTask, deleteTask } from '../lib/supabase/tasks';
import { getNotes, addNote, updateNote, deleteNote } from '../lib/supabase/notes';
import { getEvents, addEvent, deleteEvent } from '../lib/supabase/events';
import { getHabits, addHabit, deleteHabit as deleteHabitDb, toggleHabitLog } from '../lib/supabase/habits';
import { getMedicines, addMedicine, deleteMedicine as deleteMedicineDb } from '../lib/supabase/medicines';
import { getHealthLogs, saveHealthLog } from '../lib/supabase/health';
import { getProfile, updateProfile } from '../lib/supabase/profiles';
"""
    content = re.sub(r"(import React,.*?;\n)", r"\1" + imports, content, count=1)

    # 2. Replace Math.random ID generation with crypto.randomUUID()
    content = re.sub(r"'[a-z]_' \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\)", "crypto.randomUUID()", content)
    content = re.sub(r"'sub_' \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\)", "crypto.randomUUID()", content)

    # 3. Modify initializations (from useState with localStorage to useState([]) + useEffect)
    # Events
    content = re.sub(r"const \[events, setEvents\] = useState<CalendarEvent\[\]>\(\(\) => \{.+?\}\);", "const [events, setEvents] = useState<CalendarEvent[]>([]);", content, flags=re.DOTALL)
    # Notes
    content = re.sub(r"const \[notes, setNotes\] = useState<Note\[\]>\(\(\) => \{.+?\}\);", "const [notes, setNotes] = useState<Note[]>([]);", content, flags=re.DOTALL)
    # Tasks
    content = re.sub(r"const \[tasks, setTasks\] = useState<Task\[\]>\(\(\) => \{.+?\}\);", "const [tasks, setTasks] = useState<Task[]>([]);", content, flags=re.DOTALL)
    # Global Health
    content = re.sub(r"const \[globalHealth, setGlobalHealth\] = useState<HealthMetrics>\(\(\) => \{.+?\}\);", """const [globalHealth, setGlobalHealth] = useState<HealthMetrics>({
      waterToday: 0,
      sleepHours: 7,
      sleepQuality: 'good',
      moodScore: 4,
      weight: 72,
      workoutType: 'پیاده‌روی',
      workoutMin: 0
    });""", content, flags=re.DOTALL)
    # Habits
    content = re.sub(r"const \[habits, setHabits\] = useState<Habit\[\]>\(\(\) => \{.+?\}\);", "const [habits, setHabits] = useState<Habit[]>([]);", content, flags=re.DOTALL)
    # Medicines
    content = re.sub(r"const \[medicines, setMedicines\] = useState<Medicine\[\]>\(\(\) => \{.+?\}\);", "const [medicines, setMedicines] = useState<Medicine[]>([]);", content, flags=re.DOTALL)
    # Daily Health Data
    content = re.sub(r"const \[dailyHealthData, setDailyHealthData\] = useState<Record<string, .+?>>\(\(\) => \{.+?\}\);", "const [dailyHealthData, setDailyHealthData] = useState<Record<string, any>>({});", content, flags=re.DOTALL)

    # Add huge useEffect after the initializations to load data
    load_effect = """
  useEffect(() => {
    async function loadData() {
      try {
        const [t, n, e, h, m, hl, p] = await Promise.all([
          getTasks(), getNotes(), getEvents(), getHabits(), getMedicines(), getHealthLogs(), getProfile()
        ]);
        setTasks(t);
        setNotes(n);
        setEvents(e);
        setHabits(h);
        setMedicines(m);
        
        if (p) {
          // map profile defaults if needed
          setUseJalaliCalendar(p.calendar_type === 'jalali');
        }

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
        setDailyHealthData(daily);
      } catch (err) {
        console.error('Error loading data', err);
      }
    }
    loadData();
  }, [userName]);
"""
    content = content.replace("const [activeNoteId, setActiveNoteId] = useState<string | null>", load_effect + "\n  const [activeNoteId, setActiveNoteId] = useState<string | null>")

    # 4. Modify save*ToLocal to also sync differences or just update directly
    # Since writing diff logic is complex, let's just make the simple change:
    # We will override saveTasksToLocal to just update state and call a sync_tasks() function that we define.
    # Actually, the easiest diffing logic is doing it inside saveTasksToLocal:
    sync_tasks_code = """const saveTasksToLocal = (data: Task[]) => {
    const prev = tasks;
    setTasks(data);
    const pm = new Map(prev.map(t=>[t.id, t]));
    const nm = new Map(data.map(t=>[t.id, t]));
    for (const id of pm.keys()) { if (!nm.has(id)) deleteTask(id); }
    for (const [id, t] of nm.entries()) {
      if (!pm.has(id)) addTask(t);
      else if (JSON.stringify(t) !== JSON.stringify(pm.get(id))) updateTask(id, t);
    }
  };"""
    content = re.sub(r"const saveTasksToLocal = \(data: Task\[\]\) => \{\s*setTasks\(data\);\s*localStorage\.setItem\('sayeban_tasks', JSON\.stringify\(data\)\);\s*\};", sync_tasks_code, content)

    sync_notes_code = """const saveNotesToLocal = (data: Note[]) => {
    const prev = notes;
    setNotes(data);
    const pm = new Map(prev.map(n=>[n.id, n]));
    const nm = new Map(data.map(n=>[n.id, n]));
    for (const id of pm.keys()) { if (!nm.has(id)) deleteNote(id); }
    for (const [id, n] of nm.entries()) {
      if (!pm.has(id)) addNote(n);
      else if (JSON.stringify(n) !== JSON.stringify(pm.get(id))) updateNote(id, n);
    }
  };"""
    content = re.sub(r"const saveNotesToLocal = \(data: Note\[\]\) => \{\s*setNotes\(data\);\s*localStorage\.setItem\('sayeban_notes', JSON\.stringify\(data\)\);\s*\};", sync_notes_code, content)

    sync_events_code = """const saveEventsToLocal = (data: CalendarEvent[]) => {
    const prev = events;
    setEvents(data);
    const pm = new Map(prev.map(x=>[x.id, x]));
    const nm = new Map(data.map(x=>[x.id, x]));
    for (const id of pm.keys()) { if (!nm.has(id)) deleteEvent(id); }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) addEvent(x);
      // We don't support updateEvent yet in the helper, skip it
    }
  };"""
    content = re.sub(r"const saveEventsToLocal = \(data: CalendarEvent\[\]\) => \{\s*setEvents\(data\);\s*localStorage\.setItem\('sayeban_events', JSON\.stringify\(data\)\);\s*\};", sync_events_code, content)


    # daily health
    save_health_code = """const saveDailyHealth = (dateISO: string, data: Partial<{ waterToday: number; sleepHours: number; sleepQuality: 'excellent' | 'good' | 'fair' | 'poor'; moodScore: number; }>) => {
    const prev = dailyHealthData[dateISO] || { waterToday: 0, sleepHours: 7, sleepQuality: 'good', moodScore: 3 };
    const updatedDaily = { ...prev, ...data };
    const newData = { ...dailyHealthData, [dateISO]: updatedDaily };
    setDailyHealthData(newData);
    saveHealthLog(dateISO, data);
  };"""
    content = re.sub(r"const saveDailyHealth = \(dateISO: string, data: Partial<.+?>\) => \{\s*const prev = dailyHealthData\[dateISO\].+?localStorage\.setItem\('sayeban_daily_health', JSON\.stringify\(newData\)\);\s*\};", save_health_code, content, flags=re.DOTALL)

    # global health
    save_ghealth_code = """const saveHealthToLocal = (data: HealthMetrics) => {
    saveDailyHealth(selectedDateISO, {
      waterToday: data.waterToday,
      sleepHours: data.sleepHours,
      sleepQuality: data.sleepQuality,
      moodScore: data.moodScore,
      weight: data.weight
    });
    setGlobalHealth(data);
  };"""
    content = re.sub(r"const saveHealthToLocal = \(data: HealthMetrics\) => \{\s*// Save daily specifics.+?localStorage\.setItem\('sayeban_health', JSON\.stringify\(data\)\);\s*\};", save_ghealth_code, content, flags=re.DOTALL)


    # habits
    habits_code = """const saveHabitsToLocal = (data: Habit[]) => {
    const prev = habits;
    setHabits(data);
    const pm = new Map(prev.map(x=>[x.id, x]));
    const nm = new Map(data.map(x=>[x.id, x]));
    for (const id of pm.keys()) { if (!nm.has(id)) deleteHabitDb(id); }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) addHabit(x.name);
    }
  };"""
    content = re.sub(r"const saveHabitsToLocal = \(data: Habit\[\]\) => \{\s*setHabits\(data\);\s*localStorage\.setItem\('sayeban_habits', JSON\.stringify\(data\)\);\s*\};", habits_code, content)

    # toggleHabit
    toggle_h_code = """const toggleHabit = (id: string) => {
    let compl = false;
    const updated = habits.map(h => {
      if (h.id === id) {
        const completed = !isHabitCompleted(h);
        compl = completed;
        const dates = new Set(h.completedDates || []);
        if (completed) dates.add(selectedDateISO);
        else dates.delete(selectedDateISO);
        return {
          ...h,
          completedDates: Array.from(dates),
          completedToday: completed && selectedDateISO === new Date().toISOString().split('T')[0],
          streak: completed ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    });
    setHabits(updated);
    toggleHabitLog(id, selectedDateISO, compl);
  };"""
    content = re.sub(r"const toggleHabit = \(id: string\) => \{.+?saveHabitsToLocal\(updated\);\s*earnXp.+?\}\s*\};", toggle_h_code, content, flags=re.DOTALL)


    # medicines
    meds_code = """const saveMedicinesToLocal = (data: Medicine[]) => {
    const prev = medicines;
    setMedicines(data);
    const pm = new Map(prev.map(x=>[x.id, x]));
    const nm = new Map(data.map(x=>[x.id, x]));
    for (const id of pm.keys()) { if (!nm.has(id)) deleteMedicineDb(id); }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) addMedicine(x);
    }
  };"""
    content = re.sub(r"const saveMedicinesToLocal = \(data: Medicine\[\]\) => \{\s*setMedicines\(data\);\s*localStorage\.setItem\('sayeban_medicines', JSON\.stringify\(data\)\);\s*\};", meds_code, content)

    # update calendar settings
    # setUseJalaliCalendar -> sync to db
    calendar_code = """const toggleCalendar = () => {
    const val = !useJalaliCalendar;
    setUseJalaliCalendar(val);
    updateProfile({ calendar_type: val ? 'jalali' : 'gregorian' });
  };"""
    content = re.sub(r"const toggleCalendar = \(\) => \{\s*setUseJalaliCalendar\(!useJalaliCalendar\);\s*\};", calendar_code, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('components/Dashboard.tsx')
