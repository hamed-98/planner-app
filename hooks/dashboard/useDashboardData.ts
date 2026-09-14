// hooks/dashboard/useDashboardData.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CalendarEvent,
  Note,
  Task,
  HealthMetrics,
  Habit,
  Medicine,
  MoodLog,
} from '@/types/dashboard';
import { getTasks, addTask as dbAddTask, updateTask as dbUpdateTask, deleteTask as dbDeleteTask } from '@/lib/api/tasks';
import { getNotes, addNote as dbAddNote, updateNote as dbUpdateNote, deleteNote as dbDeleteNote } from '@/lib/api/notes';
import { getEvents, addEvent as dbAddEvent, deleteEvent as dbDeleteEvent } from '@/lib/api/events';
import { getHabits, addHabit as dbAddHabit, deleteHabit as dbDeleteHabit, toggleHabitLog } from '@/lib/api/habits';
import { getMedicines, addMedicine as dbAddMedicine, deleteMedicine as dbDeleteMedicine, updateMedicineLog } from '@/lib/api/medicines';
import { getHealthLogs, saveHealthLog } from '@/lib/api/health';
import { getProfile, updateProfile } from '@/lib/api/profiles';
import { getTickets } from '@/lib/api/tickets';
import {
  AggregatedBrainMetrics,
  BrainProfile,
  getAggregatedBrainMetrics,
  getBrainProfile,
  ZERO_BRAIN_PROFILE,
} from '@/lib/api/brainGym';

export function getLocalISOString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const pendingNoteUpdates = new Map<string, NodeJS.Timeout>();
const scheduleNoteUpdate = (id: string, n: Note) => {
  if (pendingNoteUpdates.has(id)) clearTimeout(pendingNoteUpdates.get(id)!);
  pendingNoteUpdates.set(
    id,
    setTimeout(() => {
      dbUpdateNote(id, n).catch(console.error);
      pendingNoteUpdates.delete(id);
    }, 1500)
  );
};

const pendingTaskUpdates = new Map<string, NodeJS.Timeout>();
const scheduleTaskUpdate = (id: string, t: Task) => {
  if (pendingTaskUpdates.has(id)) clearTimeout(pendingTaskUpdates.get(id)!);
  pendingTaskUpdates.set(
    id,
    setTimeout(() => {
      dbUpdateTask(id, t).catch(console.error);
      pendingTaskUpdates.delete(id);
    }, 1000)
  );
};

interface UseDashboardDataProps {
  userName: string;
  earnXp: (amount: number, reason: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export function useDashboardData({ userName, earnXp, showToast }: UseDashboardDataProps) {
  const [todayISO, setTodayISO] = useState('');
  const [selectedDateISO, setSelectedDateISO] = useState('');
  const [todayGregorian, setTodayGregorian] = useState('');
  const [useJalaliCalendar, setUseJalaliCalendar] = useState(true);
  const [hasUnreadTickets, setHasUnreadTickets] = useState(false);
  const [isHealthDataLoaded, setIsHealthDataLoaded] = useState(false);

  // استیت‌های داده
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_events');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_notes');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_tasks');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [globalHealth, setGlobalHealth] = useState<HealthMetrics>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_health');
      if (saved) return JSON.parse(saved);
    }
    return {
      waterToday: 0,
      sleepHours: 7,
      sleepQuality: 'good',
      moodScore: 4,
      weight: 72,
      workoutType: 'پیاده‌روی',
      workoutMin: 0,
    };
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_habits');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_medicines');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [dailyHealthData, setDailyHealthData] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_daily_health');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_mood_logs');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // ۱. مقادیر اولیه روی 0 (یا ثبت نشده)
  const [userHeight, setUserHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_user_height');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [userWeight, setUserWeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_user_weight');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [brainProfile, setBrainProfile] = useState<BrainProfile>(ZERO_BRAIN_PROFILE);
  const [brainMetrics, setBrainMetrics] = useState<AggregatedBrainMetrics | null>(null);

  const lastSavedNotesRef = useRef<Note[]>(notes);
  const lastSavedTasksRef = useRef<Task[]>(tasks);
  const lastSavedEventsRef = useRef<CalendarEvent[]>(events);
  const lastSavedHabitsRef = useRef<Habit[]>(habits);
  const lastSavedMedicinesRef = useRef<Medicine[]>(medicines);

  // مقداردهی تاریخ امروز
  useEffect(() => {
    const date = new Date();
    const iso = getLocalISOString(date);
    setTodayISO(iso);
    setSelectedDateISO(iso);
    setTodayGregorian(
      new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date)
    );
  }, []);

  // بارگذاری داده‌ها از دیتابیس
  useEffect(() => {
    async function loadData() {
      try {
        const [t, n, e, h, m, hl, p, ticketsData] = await Promise.all([
          getTasks(),
          getNotes(),
          getEvents(),
          getHabits(),
          getMedicines(),
          getHealthLogs(),
          getProfile(),
          getTickets(false),
        ]);

        if (ticketsData !== null) {
          setHasUnreadTickets(ticketsData.some((x) => x.status === 'resolved'));
        }

        if (t !== null) {
          setTasks(t);
          lastSavedTasksRef.current = t;
          localStorage.setItem('sayeban_tasks', JSON.stringify(t));
        }
        if (n !== null) {
          setNotes(n);
          lastSavedNotesRef.current = n;
          localStorage.setItem('sayeban_notes', JSON.stringify(n));
        }

        if (e !== null) {
          setEvents(e);
          lastSavedEventsRef.current = e;
          localStorage.setItem('sayeban_events', JSON.stringify(e));
        }
        if (h !== null) {
          setHabits(h);
          lastSavedHabitsRef.current = h;
          localStorage.setItem('sayeban_habits', JSON.stringify(h));
        }
        if (m !== null) {
          setMedicines(m);
          lastSavedMedicinesRef.current = m;
          localStorage.setItem('sayeban_medicines', JSON.stringify(m));
        }

        // if (p?.calendar_type !== undefined) {
        //   setUseJalaliCalendar(p.calendar_type === 'jalali');
        // }

        // اصلاح شود به (پشتیبانی مطمئن از هر دو فرمت):
        const calType = p?.calendarType || p?.calendar_type;
        if (calType !== undefined) {
          setUseJalaliCalendar(calType === 'jalali');
        }


        if (hl !== null) {
        const daily: Record<string, any> = {};
        const fetchedMoodLogs: MoodLog[] = [];
        let latestWeight = 0;
        let latestLogDate = '';

        for (const log of hl) {
          const sq =
            log.sleep_quality === 1
              ? 'poor'
              : log.sleep_quality === 2
                ? 'fair'
                : log.sleep_quality === 3
                  ? 'good'
                  : 'excellent';

          daily[log.log_date] = {
            waterToday: log.water_ml || 0,
            sleepHours: log.sleep_hours || 0,
            sleepQuality: sq,
            moodScore: log.mood || 3,
            weight: log.weight_kg || 0,
          };

          // استخراج تاریخچه احساسات واقعی کاربر از دیتابیس
          if (log.mood && log.log_date) {
            fetchedMoodLogs.push({
              date: log.log_date,
              mood: log.mood,
            });
          }

          // پیدا کردن آخرین وزنی که کاربر ثبت کرده
          if (log.weight_kg && Number(log.weight_kg) > 0) {
            if (!latestLogDate || log.log_date >= latestLogDate) {
              latestWeight = Number(log.weight_kg);
              latestLogDate = log.log_date;
            }
          }
        }

        // ذخیره سوابق واقعی احساسات کاربر
        fetchedMoodLogs.sort((a, b) => a.date.localeCompare(b.date));
        setMoodLogs(fetchedMoodLogs);
        localStorage.setItem('sayeban_mood_logs', JSON.stringify(fetchedMoodLogs));

        if (latestWeight > 0) {
          setUserWeight(latestWeight);
          localStorage.setItem('sayeban_user_weight', String(latestWeight));
        }

        setDailyHealthData((prev) => {
          const updated = { ...prev, ...daily };
          localStorage.setItem('sayeban_daily_health', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error('Error loading data', err);
    } finally {
      setIsHealthDataLoaded(true);
    }
    }
    loadData();
  }, [userName]);

  // شاخص‌های باشگاه مغز
  useEffect(() => {
    getBrainProfile().then((p) => {
      if (p) setBrainProfile(p);
    });
    getAggregatedBrainMetrics(selectedDateISO || todayISO).then((m) => {
      if (m) setBrainMetrics(m);
    });
  }, [selectedDateISO, todayISO]);

  // توابع ذخیره‌سازی داده‌ها
  const saveEventsToLocal = useCallback((data: CalendarEvent[]) => {
    const prev = lastSavedEventsRef.current;
    lastSavedEventsRef.current = data;
    setEvents(data);
    localStorage.setItem('sayeban_events', JSON.stringify(data));
    const pm = new Map(prev.map((x) => [x.id, x]));
    const nm = new Map(data.map((x) => [x.id, x]));
    for (const id of pm.keys()) {
      if (!nm.has(id)) dbDeleteEvent(id).catch(console.error);
    }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) dbAddEvent(x).catch(console.error);
    }
  }, []);

  const saveNotesToLocal = useCallback((data: Note[]) => {
    const prev = lastSavedNotesRef.current;
    lastSavedNotesRef.current = data;
    setNotes(data);
    localStorage.setItem('sayeban_notes', JSON.stringify(data));
    const pm = new Map(prev.map((n) => [n.id, n]));
    const nm = new Map(data.map((n) => [n.id, n]));
    for (const id of pm.keys()) {
      if (!nm.has(id)) dbDeleteNote(id).catch(console.error);
    }
    for (const [id, n] of nm.entries()) {
      if (!pm.has(id)) dbAddNote(n).catch(console.error);
      else if (JSON.stringify(n) !== JSON.stringify(pm.get(id))) scheduleNoteUpdate(id, n);
    }
  }, []);

  const saveTasksToLocal = useCallback((data: Task[]) => {
    const prev = lastSavedTasksRef.current;
    lastSavedTasksRef.current = data;
    setTasks(data);
    localStorage.setItem('sayeban_tasks', JSON.stringify(data));
    const pm = new Map(prev.map((t) => [t.id, t]));
    const nm = new Map(data.map((t) => [t.id, t]));
    for (const id of pm.keys()) {
      if (!nm.has(id)) dbDeleteTask(id).catch(console.error);
    }
    for (const [id, t] of nm.entries()) {
      if (!pm.has(id)) dbAddTask(t).catch(console.error);
      else if (JSON.stringify(t) !== JSON.stringify(pm.get(id))) scheduleTaskUpdate(id, t);
    }
  }, []);

  const saveDailyHealth = useCallback(
    (dateISO: string, data: Partial<{ waterToday: number; sleepHours: number; sleepQuality: any; moodScore: number; weight: number }>) => {
      setDailyHealthData((prev) => {
        const existing = prev[dateISO] || {
          waterToday: 0,
          sleepHours: 7,
          sleepQuality: 'good',
          moodScore: 3,
          weight: userWeight,
        };
        const updatedDaily = { ...existing, ...data };
        const newData = { ...prev, [dateISO]: updatedDaily };
        localStorage.setItem('sayeban_daily_health', JSON.stringify(newData));
        return newData;
      });
      saveHealthLog(dateISO, data).catch(console.error);
    },
    [userWeight]
  );

  const saveHealthToLocal = useCallback(
    (data: HealthMetrics) => {
      const safeWater = Math.max(0, Math.min(4000, Number(data.waterToday) || 0));
      const validatedData = { ...data, waterToday: safeWater };
      saveDailyHealth(selectedDateISO, {
        waterToday: validatedData.waterToday,
        sleepHours: validatedData.sleepHours,
        sleepQuality: validatedData.sleepQuality,
        moodScore: validatedData.moodScore,
      });
      setGlobalHealth(validatedData);
      localStorage.setItem('sayeban_health', JSON.stringify(validatedData));
      localStorage.removeItem(`sayeban_daily_ai_tip_${selectedDateISO}`);
    },
    [selectedDateISO, saveDailyHealth]
  );

  const saveHabitsToLocal = useCallback((data: Habit[]) => {
    const prev = lastSavedHabitsRef.current;
    lastSavedHabitsRef.current = data;
    setHabits(data);
    localStorage.setItem('sayeban_habits', JSON.stringify(data));
    const pm = new Map(prev.map((x) => [x.id, x]));
    const nm = new Map(data.map((x) => [x.id, x]));
    for (const id of pm.keys()) {
      if (!nm.has(id)) dbDeleteHabit(id).catch(console.error);
    }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) dbAddHabit(x.id, x.name).catch(console.error);
    }
  }, []);

  const saveMedicinesToLocal = useCallback((data: Medicine[]) => {
    const prev = lastSavedMedicinesRef.current;
    lastSavedMedicinesRef.current = data;
    setMedicines(data);
    localStorage.setItem('sayeban_medicines', JSON.stringify(data));
    const pm = new Map(prev.map((x) => [x.id, x]));
    const nm = new Map(data.map((x) => [x.id, x]));
    for (const id of pm.keys()) {
      if (!nm.has(id)) dbDeleteMedicine(id).catch(console.error);
    }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) dbAddMedicine(x).catch(console.error);
    }
  }, []);

  const saveUserHeight = useCallback((h: number) => {
    setUserHeight(h);
    localStorage.setItem('sayeban_user_height', String(h));
  }, []);

  const saveUserWeight = useCallback(
    (w: number) => {
      const cleanWeight = Math.max(30, Math.min(250, Number(w.toFixed(1))));
      setUserWeight(cleanWeight);
      localStorage.setItem('sayeban_user_weight', String(cleanWeight));
      saveDailyHealth(selectedDateISO || todayISO, { weight: cleanWeight });
    },
    [selectedDateISO, todayISO, saveDailyHealth]
  );

  const saveMoodLog = useCallback((dateStr: string, score: number) => {
    setMoodLogs((prev) => {
      const existing = prev.filter((l) => l.date !== dateStr);
      const updated = [...existing, { date: dateStr, mood: score }].sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem('sayeban_mood_logs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const modifySelectedDate = useCallback((days: number) => {
    setSelectedDateISO((prev) => {
      if (!prev) return prev;
      const date = new Date(prev + 'T12:00:00Z');
      date.setUTCDate(date.getUTCDate() + days);
      return date.toISOString().split('T')[0];
    });
  }, []);

  const isSelectedDatePast = Boolean(selectedDateISO && todayISO && selectedDateISO < todayISO);
  const isSelectedDateFuture = Boolean(selectedDateISO && todayISO && selectedDateISO > todayISO);

  const activeDailyHealth = dailyHealthData[selectedDateISO] || {
    waterToday: 0,
    sleepHours: 0,
    sleepQuality: 'fair',
    moodScore: 3,
  };
  const health: HealthMetrics = { ...globalHealth, ...activeDailyHealth };

  const isHabitCompleted = useCallback(
    (h: Habit) => {
      return (h.completedDates || []).includes(selectedDateISO) || (Boolean(h.completedToday) && selectedDateISO === todayISO);
    },
    [selectedDateISO, todayISO]
  );

  const isMedicineCompleted = useCallback(
    (m: Medicine) => {
      return (m.completedDates || []).includes(selectedDateISO) || (Boolean(m.completedToday) && selectedDateISO === todayISO);
    },
    [selectedDateISO, todayISO]
  );

  const toggleHabit = useCallback(
    (id: string) => {
      if (isSelectedDatePast || isSelectedDateFuture) {
        showToast('امکان تغییر وضعیت عادات در گذشته یا آینده وجود ندارد.', 'error');
        return;
      }
      let compl = false;
      let hName = '';
      const updated = habits.map((h) => {
        if (h.id === id) {
          const completed = !isHabitCompleted(h);
          compl = completed;
          hName = h.name;
          const dates = new Set(h.completedDates || []);
          if (completed) dates.add(selectedDateISO);
          else dates.delete(selectedDateISO);
          return {
            ...h,
            completedDates: Array.from(dates),
            completedToday: completed && selectedDateISO === todayISO,
            streak: completed ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      });
      setHabits(updated);
      toggleHabitLog(id, selectedDateISO, compl).catch(console.error);
      showToast('وضعیت عادت با موفقیت تغییر کرد! 🔥', 'success');
      if (compl) earnXp(15, `تکمیل عادت سالم "${hName}"`);
      else earnXp(-15, `تکمیل عادت سالم "${hName}"`);
    },
    [habits, isSelectedDatePast, isSelectedDateFuture, isHabitCompleted, selectedDateISO, todayISO, earnXp, showToast]
  );

  const toggleMedicine = useCallback(
    (id: string) => {
      if (isSelectedDatePast || isSelectedDateFuture) {
        showToast('امکان تغییر وضعیت مکمل‌ها در گذشته یا آینده وجود ندارد.', 'error');
        return;
      }
      let earned = false;
      let name = '';
      let nextDates: string[] = [];

      const updated = medicines.map((m) => {
        if (m.id === id) {
          const compl = !isMedicineCompleted(m);
          earned = compl;
          name = m.name;
          const dates = new Set(m.completedDates || []);
          if (compl) dates.add(selectedDateISO);
          else dates.delete(selectedDateISO);
          nextDates = Array.from(dates);
          return { ...m, completedDates: nextDates, completedToday: compl && selectedDateISO === todayISO };
        }
        return m;
      });

      saveMedicinesToLocal(updated);
      updateMedicineLog(id, nextDates);
      showToast('وضعیت مصرف مکمل با موفقیت ثبت شد. 💊', 'success');
      if (earned) earnXp(10, `مصرف مکمل ${name}`);
      else earnXp(-10, `مصرف مکمل ${name}`);
    },
    [medicines, isSelectedDatePast, isSelectedDateFuture, isMedicineCompleted, selectedDateISO, todayISO, saveMedicinesToLocal, earnXp, showToast]
  );

  const handleAddWater = useCallback(
    (amount: number) => {
      if (isSelectedDatePast || isSelectedDateFuture) {
        showToast('امکان ثبت مصرف آب برای روزهای گذشته یا آینده وجود ندارد.', 'error');
        return;
      }
      const currentWater = Math.max(0, Number(health.waterToday) || 0);

      if (amount < 0) {
        if (currentWater <= 0) {
          showToast('تعداد لیوان آب صفر است و نمی‌تواند کمتر شود.', 'info');
          return;
        }
        const nextWater = Math.max(0, currentWater + amount);
        saveHealthToLocal({ ...health, waterToday: nextWater });
        return;
      }

      const nextWater = Math.min(14, currentWater + amount);
      if (nextWater === currentWater && currentWater >= 14) {
        showToast('به حداکثر سقف ثبت آب روزانه (۱۴ لیوان) رسیده‌اید.', 'info');
        return;
      }

      saveHealthToLocal({ ...health, waterToday: nextWater });

      const waterXpKey = `water_xp_${selectedDateISO}`;
      if (nextWater >= 8 && currentWater < 8 && !localStorage.getItem(waterXpKey)) {
        earnXp(20, 'تکمیل هدف نوشیدن ۸ لیوان آب روزانه 💧');
        localStorage.setItem(waterXpKey, 'true');
      }
    },
    [health, isSelectedDatePast, isSelectedDateFuture, saveHealthToLocal, selectedDateISO, earnXp, showToast]
  );

  const handleSelectMood = useCallback(
    (score: number, label: string) => {
      if (isSelectedDatePast || isSelectedDateFuture) return;
      saveHealthToLocal({ ...health, moodScore: score });
      saveMoodLog(selectedDateISO, score);

      const moodXpKey = `mood_xp_${selectedDateISO}`;
      if (!localStorage.getItem(moodXpKey)) {
        earnXp(10, `ثبت اولین پایش روحی امروز (${label})`);
        localStorage.setItem(moodXpKey, 'true');
        showToast(`حال روحی شما روی "${label}" ثبت شد (+۱۰ XP)`, 'success');
      } else {
        showToast(`حال روحی به "${label}" به‌روزرسانی شد.`, 'info');
      }
    },
    [health, isSelectedDatePast, isSelectedDateFuture, saveHealthToLocal, saveMoodLog, selectedDateISO, earnXp, showToast]
  );

  const toggleCalendarType = useCallback(() => {
  setUseJalaliCalendar((prev) => {
    const next = !prev;
    const value = next ? 'jalali' : 'gregorian';
    updateProfile({ calendarType: value }); // فقط نام دقیق فیلد اسکیما ارسال شود
    return next;
  });
}, []);

  return {
    todayISO,
    selectedDateISO,
    setSelectedDateISO,
    todayGregorian,
    useJalaliCalendar,
    toggleCalendarType,
    hasUnreadTickets,
    setHasUnreadTickets,
    isHealthDataLoaded,
    events,
    notes,
    tasks,
    health,
    habits,
    medicines,
    moodLogs,
    userHeight,
    userWeight,
    brainProfile,
    brainMetrics,
    isSelectedDatePast,
    isSelectedDateFuture,
    lastSavedTasksRef,
    lastSavedEventsRef,
    lastSavedNotesRef,
    saveEventsToLocal,
    saveNotesToLocal,
    saveTasksToLocal,
    saveHealthToLocal,
    saveHabitsToLocal,
    saveMedicinesToLocal,
    saveUserHeight,
    saveUserWeight,
    modifySelectedDate,
    toggleHabit,
    toggleMedicine,
    isHabitCompleted,
    isMedicineCompleted,
    handleAddWater,
    handleSelectMood,
  };
}