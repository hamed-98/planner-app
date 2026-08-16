'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getTasks, addTask as dbAddTask, updateTask as dbUpdateTask, deleteTask as dbDeleteTask } from '../lib/supabase/tasks';
import { getNotes, addNote as dbAddNote, updateNote as dbUpdateNote, deleteNote as dbDeleteNote } from '../lib/supabase/notes';
import { getEvents, addEvent as dbAddEvent, deleteEvent as dbDeleteEvent } from '../lib/supabase/events';
import { getHabits, addHabit as dbAddHabit, deleteHabit as dbDeleteHabit, toggleHabitLog } from '../lib/supabase/habits';
import { getMedicines, addMedicine as dbAddMedicine, deleteMedicine as dbDeleteMedicine } from '../lib/supabase/medicines';
import { getHealthLogs, saveHealthLog } from '../lib/supabase/health';
import { getProfile, updateProfile } from '../lib/supabase/profiles';
import { getTickets } from '../lib/supabase/tickets';
import SupportTabView from './SupportTabView';
import MonthlyCalendarView from './MonthlyCalendarView';
import BrainGymView from './BrainGymView';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format as formatJalali } from 'date-fns-jalali';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  Activity, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  FolderPlus, 
  Pin, 
  Grid, 
  Mic, 
  Settings, 
  BarChart2, 
  LogOut, 
  Droplet, 
  Moon, 
  Heart, 
  Share2, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  Tag, 
  Smile, 
  PlusCircle, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Bell,
  X,
  SkipForward,
  SkipBack,
  Music,
  MessageSquare,
  Brain
} from 'lucide-react';

// Interfaces for our applet state
export interface CalendarEvent {
  id: string;
  title: string;
  desc: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: 'work' | 'personal' | 'health' | 'learning';
  recurrence: 'none' | 'daily' | 'weekly';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  isPinned: boolean;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface HealthMetrics {
  waterToday: number; // in ml
  sleepHours: number;
  sleepQuality: 'excellent' | 'good' | 'fair' | 'poor';
  moodScore: number; // 1-5
  weight: number; // in kg
  workoutType: string;
  workoutMin: number;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDates?: string[];
  completedToday?: boolean; // legacy migration
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  completedDates?: string[];
  completedToday?: boolean; // legacy migration
}

interface DashboardProps {
  userName: string;
  onLogout: () => void;
}

function getLocalISOString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toPersianDigits(str: string) {
  return str.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
}

// Simple Solar Hijri (Shamsi) conversion helper using date-fns-jalali
function getJalaliDate(gregorianDateStr: string, formatStr: string = 'd MMMM yyyy') {
  try {
    const d = new Date(gregorianDateStr);
    if (isNaN(d.getTime())) return gregorianDateStr;
    const jalaliFormatted = formatJalali(d, formatStr);
    return toPersianDigits(jalaliFormatted);
  } catch (e) {
    return gregorianDateStr;
  }
}


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

export default function Dashboard({ userName, onLogout }: DashboardProps) {
  const router = useRouter();
  // Tabs: 'overview', 'planner', 'notes', 'tasks', 'health', 'settings', 'support', 'calendar', 'brain_gym'
  const [activeTab, setActiveTab] = useState<'overview' | 'planner' | 'notes' | 'tasks' | 'health' | 'settings' | 'support' | 'calendar' | 'brain_gym'>('overview');
  
  const [useJalaliCalendar, setUseJalaliCalendar] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [hasUnreadTickets, setHasUnreadTickets] = useState(false);

  // Core Data State loaded from localStorage on mount using lazy initializers
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_events');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_notes');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== "undefined") {
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
    return { waterToday: 0, sleepHours: 7, sleepQuality: 'good', moodScore: 4, weight: 72, workoutType: 'پیاده‌روی', workoutMin: 0 };
  });

  // Habits State persisted locally
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_habits');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // Medicine State persisted locally
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_medicines');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // Form states for dynamic habits and medicines
  const [newHabitName, setNewHabitName] = useState("");
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedTime, setNewMedTime] = useState("08:00");

  // --- Gamification State ---
  const [xp, setXp] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_xp');
      return saved ? parseInt(saved, 10) : 150;
    }
    return 150;
  });

  const level = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;

  const earnXp = (amount: number, reason: string) => {
    setXp(prev => {
      const nextXp = Math.max(0, prev + amount);
      if (typeof window !== "undefined") {
        localStorage.setItem('sayeban_xp', String(nextXp));
      }
      return nextXp;
    });
    if (amount > 0) {
      playAudioFeedback('xp');
      showToast(`🔥 ${amount}+ امتیاز تجربه (XP) برای ${reason}!`, "success");
    } else if (amount < 0) {
      showToast(`⚠️ ${Math.abs(amount)}- امتیاز تجربه به دلیل لغو ${reason}`, "info");
    }
  };

  const checkAndIncrementAiRequests = (): boolean => {
    if (typeof window === "undefined") return true;
    const todayStr = getLocalISOString(new Date());
    const limitSaved = localStorage.getItem('sayeban_ai_daily_limit');
    const currentLimit = limitSaved ? parseInt(limitSaved, 10) : 5;

    const savedUsage = localStorage.getItem('sayeban_ai_usage');
    let usage = { date: todayStr, count: 0 };
    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        if (parsed.date === todayStr) {
          usage = parsed;
        }
      } catch (e) {}
    }

    if (usage.count >= currentLimit) {
      showToast(`⚠️ سقف مجاز روزانه شما برای هوش مصنوعی (${currentLimit} درخواست) به پایان رسیده است.`, "error");
      return false;
    }

    usage.count += 1;
    localStorage.setItem('sayeban_ai_usage', JSON.stringify(usage));
    return true;
  };

  // Sound Synth Generator for Micro Interactions and Zen Modes
  const playAudioFeedback = (type: string) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      } else if (type === 'done' || type === 'success_check') {
        // Double sweet chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      } else if (type === 'xp') {
        // Bright metallic ascent
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      } else if (type === 'zen_finish') {
        // Deep ambient relaxation bell / chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15); // E4
        osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.3); // G4
        osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.45); // C5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      } else {
        return;
      }
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch {
      // Audio engine muted/not interactions-focused
    }
  };

  // --- Zen Mode / Pomodoro Timer ---
  const [isZenMode, setIsZenMode] = useState(false);
  const [zenFocusDuration, setZenFocusDuration] = useState(25); // in minutes
  const [zenBreakDuration, setZenBreakDuration] = useState(5); // in minutes
  const [zenTimeRemaining, setZenTimeRemaining] = useState(25 * 60);
  const [isZenTimerRunning, setIsZenTimerRunning] = useState(false);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [zenTimerType, setZenTimerType] = useState<'focus' | 'break'>('focus');
  const [zenSelectedTaskId, setZenSelectedTaskId] = useState<string | null>(null);
  const [isZenAudioPlaying, setIsZenAudioPlaying] = useState(false);
  
  // Dynamic audio categories and tracks
  const [zenCategories, setZenCategories] = useState<any[]>([]);
  const [zenActiveCatId, setZenActiveCatId] = useState<string | null>(null);
  const [zenActiveTrackIndex, setZenActiveTrackIndex] = useState<number>(0);
  const [zenAudioLoop, setZenAudioLoop] = useState<'none' | 'one' | 'all'>('all'); // none, one (repeat single), all (loop playlist)
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Obsidian Notes Link Graph Toggle ---
  const [showNotesGraph, setShowNotesGraph] = useState(false);

  // --- Onboarding / Customizer wizard ---
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem('sayeban_onboarding_completed');
    }
    return false;
  });
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingPersona, setOnboardingPersona] = useState<'student' | 'freelancer' | 'manager' | 'health'>('student');

  // --- Command Palette State ---
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [cmdSearchQuery, setCmdSearchQuery] = useState("");

  // Assistant State
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('sayeban_custom_api_key') || "";
    }
    return "";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const saveCustomApiKey = (key: string) => {
    setCustomApiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem('sayeban_custom_api_key', key);
    }
    showToast("تنظیمات کلید اختصاصی جمینای با موفقیت ثبت شد. سیستم فوراً همگام گردید!", "success");
  };

  const [aiTip, setAiTip] = useState<string>("در حال دریافت توصیه‌های امروز از دستیار هوشمند سایبان...");
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: `سلام ${userName} عزیز! امروز چطور می‌تونم بهت در برنامه‌ریزی یا تندرستی کمک کنم؟ می‌تونی بنویسی: «فردا ساعت ۱۸ قرار ملاقات با علی اضافه کن»` }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Quick Add Modal Trigger
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddResult, setQuickAddResult] = useState<string | null>(null);

  // Form states
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(() => getLocalISOString(new Date()));
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newEventCat, setNewEventCat] = useState<'work' | 'personal' | 'health' | 'learning'>('work');

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newTaskDue, setNewTaskDue] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [activeHealthSubTab, setActiveHealthSubTab] = useState<'habits_meds' | 'water_sleep' | 'bmi' | 'mood'>('habits_meds');
  const [showAllDatesTasks, setShowAllDatesTasks] = useState(false);
  const [announcement, setAnnouncement] = useState<{show: boolean; text: string; type: string} | null>(null);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const { createClient } = await import('../lib/supabase/client');
      const supabase = createClient();
      
      const { data: annData } = await supabase.from('global_settings').select('value').eq('id', 'announcements').single() as any;
      if (annData?.value && annData.value.show) {
        setAnnouncement(annData.value);
      }

      const { data: landingData } = await supabase.from('global_settings').select('value').eq('id', 'landing_page').single() as any;
      if (landingData?.value) {
        let categories = landingData.value.zen_categories;
        if (!categories && landingData.value.zen_tracks) {
          const oldTracks = landingData.value.zen_tracks || {};
          categories = [
            {
              id: 'deep_work',
              name: 'کار عمیق (Deep Work)',
              tracks: oldTracks.deep_work?.url ? [{ id: 'tr_1', name: oldTracks.deep_work.name || 'آهنگ کار عمیق', url: oldTracks.deep_work.url }] : []
            },
            {
              id: 'creativity',
              name: 'خلاقیت (Creativity)',
              tracks: oldTracks.creativity?.url ? [{ id: 'tr_2', name: oldTracks.creativity.name || 'آهنگ خلاقیت', url: oldTracks.creativity.url }] : []
            },
            {
              id: 'learning',
              name: 'یادگیری (Learning)',
              tracks: oldTracks.learning?.url ? [{ id: 'tr_3', name: oldTracks.learning.name || 'آهنگ یادگیری', url: oldTracks.learning.url }] : []
            },
            {
              id: 'chill',
              name: 'آرامش (Chill)',
              tracks: oldTracks.chill?.url ? [{ id: 'tr_4', name: oldTracks.chill.name || 'آهنگ آرامش', url: oldTracks.chill.url }] : []
            }
          ];
        }
        if (categories && categories.length > 0) {
          setZenCategories(categories);
          const firstNonEmpty = categories.find((c: any) => c.tracks && c.tracks.length > 0);
          if (firstNonEmpty) {
            setZenActiveCatId(firstNonEmpty.id);
          } else {
            setZenActiveCatId(categories[0].id);
          }
        }
      }
    };
    fetchGlobalSettings();
  }, []);

  const [dailyHealthData, setDailyHealthData] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_daily_health');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  const saveDailyHealth = (dateISO: string, data: Partial<{ waterToday: number; sleepHours: number; sleepQuality: 'excellent' | 'good' | 'fair' | 'poor'; moodScore: number; weight: number; }>) => {
    const prev = dailyHealthData[dateISO] || { waterToday: 0, sleepHours: 7, sleepQuality: 'good', moodScore: 3, weight: 72 };
    const updatedDaily = { ...prev, ...data };
    const newData = { ...dailyHealthData, [dateISO]: updatedDaily };
    setDailyHealthData(newData);
    localStorage.setItem('sayeban_daily_health', JSON.stringify(newData));
    saveHealthLog(dateISO, data).catch(console.error);
  };

  // Today's Date representation
  const [todayISO, setTodayISO] = useState("");
  const [selectedDateISO, setSelectedDateISO] = useState("");
  const [todayGregorian, setTodayGregorian] = useState("");
  useEffect(() => {
    const date = new Date();
    const iso = getLocalISOString(date);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayISO(iso);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDateISO(iso);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewEventDate(iso);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewTaskDue(iso);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayGregorian(new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date));
  }, []);

  const todayJalali = todayISO ? getJalaliDate(todayISO) : "";
  const selectedDateJalali = selectedDateISO ? getJalaliDate(selectedDateISO) : "";
  const selectedDateGregorian = selectedDateISO ? new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(selectedDateISO)) : "";

  const activeDailyHealth = dailyHealthData[selectedDateISO] || { waterToday: 0, sleepHours: 7, sleepQuality: 'good' as const, moodScore: 3 };
  const health = { ...globalHealth, ...activeDailyHealth };

  const isSelectedDatePast = !!(selectedDateISO && todayISO && selectedDateISO < todayISO);
  const isSelectedDateFuture = !!(selectedDateISO && todayISO && selectedDateISO > todayISO);

  
  useEffect(() => {
    async function loadData() {
      try {
        const [t, n, e, h, m, hl, p, ticketsData] = await Promise.all([
          getTasks(), getNotes(), getEvents(), getHabits(), getMedicines(), getHealthLogs(), getProfile(), getTickets(false)
        ]);
        
        if (ticketsData !== null) {
          setHasUnreadTickets(ticketsData.some(x => x.status === 'resolved'));
        }
                
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

        if (p) {
          if (p.calendar_type !== undefined) setUseJalaliCalendar(p.calendar_type === 'jalali');
        }
                if (hl !== null) {
          const daily: Record<string, any> = {};
          let latestWeight = 0;
          let latestLogDate = '';
          for (const log of hl) {
            const sq = log.sleep_quality === 1 ? 'poor' : log.sleep_quality === 2 ? 'fair' : log.sleep_quality === 3 ? 'good' : 'excellent';
            daily[log.log_date] = {
              waterToday: log.water_ml || 0,
              sleepHours: log.sleep_hours || 0,
              sleepQuality: sq,
              moodScore: log.mood || 3,
              weight: log.weight_kg || 0
            };
            if (log.weight_kg && (!latestLogDate || log.log_date > latestLogDate)) {
              latestWeight = log.weight_kg;
              latestLogDate = log.log_date;
            }
          }
          if (latestWeight > 0) {
            setUserWeight(latestWeight);
            localStorage.setItem('sayeban_user_weight', String(latestWeight));
          }
          setDailyHealthData(prev => {
            const updated = { ...prev, ...daily };
            localStorage.setItem('sayeban_daily_health', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error('Error loading data', err);
      }
    }
    loadData();
  }, [userName]);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[0]?.id || null;
      }
    }
    return 'n1';
  });
  
  const lastSavedNotesRef = useRef<Note[]>(notes);
  const lastSavedTasksRef = useRef<Task[]>(tasks);
  const lastSavedEventsRef = useRef<CalendarEvent[]>(events);
  const lastSavedHabitsRef = useRef<Habit[]>(habits);
  const lastSavedMedicinesRef = useRef<Medicine[]>(medicines);

  const [noteSearch, setNoteSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("همه");

  // File Upload Drag-and-Drop state for notes attachments
  const [isDragOver, setIsDragOver] = useState(false);
  const [noteAttachments, setNoteAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isAiResponding]);

  // Save changes to local persistence
  const saveEventsToLocal = (data: CalendarEvent[]) => {
    const prev = lastSavedEventsRef.current;
    // eslint-disable-next-line react-hooks/immutability
    lastSavedEventsRef.current = data;
    setEvents(data);
    localStorage.setItem('sayeban_events', JSON.stringify(data));
    const pm = new Map(prev.map(x=>[x.id, x]));
    const nm = new Map(data.map(x=>[x.id, x]));
    for (const id of pm.keys()) { if (!nm.has(id)) dbDeleteEvent(id).catch(console.error); }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) dbAddEvent(x).catch(console.error);
    }
  };

  const saveNotesToLocal = (data: Note[]) => {
    const prev = lastSavedNotesRef.current;
    // eslint-disable-next-line react-hooks/immutability
    lastSavedNotesRef.current = data;
    setNotes(data);
    localStorage.setItem('sayeban_notes', JSON.stringify(data));
    const pm = new Map(prev.map(n=>[n.id, n]));
    const nm = new Map(data.map(n=>[n.id, n]));
    for (const id of pm.keys()) { if (!nm.has(id)) dbDeleteNote(id).catch(console.error); }
    for (const [id, n] of nm.entries()) {
      if (!pm.has(id)) dbAddNote(n).catch(console.error);
      else if (JSON.stringify(n) !== JSON.stringify(pm.get(id))) scheduleNoteUpdate(id, n);
    }
  };

  const saveTasksToLocal = (data: Task[]) => {
    const prev = lastSavedTasksRef.current;
    // eslint-disable-next-line react-hooks/immutability
    lastSavedTasksRef.current = data;
    setTasks(data);
    localStorage.setItem('sayeban_tasks', JSON.stringify(data));
    const pm = new Map(prev.map(t=>[t.id, t]));
    const nm = new Map(data.map(t=>[t.id, t]));
    for (const id of pm.keys()) { if (!nm.has(id)) dbDeleteTask(id).catch(console.error); }
    for (const [id, t] of nm.entries()) {
      if (!pm.has(id)) dbAddTask(t).catch(console.error);
      else if (JSON.stringify(t) !== JSON.stringify(pm.get(id))) scheduleTaskUpdate(id, t);
    }
  };

  const saveHealthToLocal = (data: HealthMetrics) => {
    saveDailyHealth(selectedDateISO, {
      waterToday: data.waterToday,
      sleepHours: data.sleepHours,
      sleepQuality: data.sleepQuality,
      moodScore: data.moodScore
    });
    setGlobalHealth(data);
    localStorage.setItem('sayeban_health', JSON.stringify(data));
  };

  const saveHabitsToLocal = (data: Habit[]) => {
    const prev = lastSavedHabitsRef.current;
    // eslint-disable-next-line react-hooks/immutability
    lastSavedHabitsRef.current = data;
    setHabits(data);
    localStorage.setItem('sayeban_habits', JSON.stringify(data));
    const pm = new Map(prev.map(x=>[x.id, x]));
    const nm = new Map(data.map(x=>[x.id, x]));
    for (const id of pm.keys()) { if (!nm.has(id)) dbDeleteHabit(id).catch(console.error); }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) dbAddHabit(x.id, x.name).catch(console.error);
    }
  };

  const saveMedicinesToLocal = (data: Medicine[]) => {
    const prev = lastSavedMedicinesRef.current;
    // eslint-disable-next-line react-hooks/immutability
    lastSavedMedicinesRef.current = data;
    setMedicines(data);
    localStorage.setItem('sayeban_medicines', JSON.stringify(data));
    const pm = new Map(prev.map(x=>[x.id, x]));
    const nm = new Map(data.map(x=>[x.id, x]));
    for (const id of pm.keys()) { if (!nm.has(id)) dbDeleteMedicine(id).catch(console.error); }
    for (const [id, x] of nm.entries()) {
      if (!pm.has(id)) dbAddMedicine(x).catch(console.error);
    }
  };

  const [userHeight, setUserHeight] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_user_height');
      if (saved) return Number(saved);
    }
    return 175; // default 175 cm
  });

  const saveUserHeight = (h: number) => {
    setUserHeight(h);
    localStorage.setItem('sayeban_user_height', String(h));
  };

  const [userWeight, setUserWeight] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_user_weight');
      if (saved) return Number(saved);
      const savedHealth = localStorage.getItem('sayeban_health');
      if (savedHealth) {
        try {
          const parsed = JSON.parse(savedHealth);
          if (parsed.weight) return Number(parsed.weight);
        } catch (e) {}
      }
    }
    return 72; // default 72 kg
  });

  const saveUserWeight = (w: number) => {
    setUserWeight(w);
    localStorage.setItem('sayeban_user_weight', String(w));
    // Under the hood, sync this weight to today's database log so that database weight tracking still works!
    const todayStr = new Date().toISOString().split('T')[0];
    saveDailyHealth(todayStr, {
      weight: w
    });
  };

  const [moodLogs, setMoodLogs] = useState<{ date: string; mood: number }[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('sayeban_mood_logs');
      if (saved) return JSON.parse(saved);
    }
    return [
      { date: '2026-06-15', mood: 4 },
      { date: '2026-06-16', mood: 5 },
      { date: '2026-06-17', mood: 3 },
      { date: '2026-06-18', mood: 4 },
      { date: '2026-06-19', mood: 5 }
    ];
  });

  const saveMoodLog = (dateStr: string, score: number) => {
    const existing = moodLogs.filter(l => l.date !== dateStr);
    const updated = [...existing, { date: dateStr, mood: score }].sort((a, b) => a.date.localeCompare(b.date));
    setMoodLogs(updated);
    localStorage.setItem('sayeban_mood_logs', JSON.stringify(updated));
  };

  const addSubtask = (taskId: string, titleStr: string) => {
    if (!titleStr.trim()) return;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const sub = t.subtasks || [];
        return {
          ...t,
          subtasks: [...sub, { id: crypto.randomUUID(), title: titleStr.trim(), completed: false }]
        };
      }
      return t;
    });
    saveTasksToLocal(updated);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const sub = (t.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return { ...t, subtasks: sub };
      }
      return t;
    });
    saveTasksToLocal(updated);
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const sub = (t.subtasks || []).filter(s => s.id !== subtaskId);
        return { ...t, subtasks: sub };
      }
      return t;
    });
    saveTasksToLocal(updated);
  };

  // Greeting Message logic based on Persian time of day
  const [greeting, setGreeting] = useState(() => {
    if (typeof window === 'undefined') return '';
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'صبح زیبای شما بخیر';
    if (hr >= 12 && hr < 17) return 'ظهر شما بخیر و شادی';
    if (hr >= 17 && hr < 21) return 'عصر متفکرانه‌ای داشته باشید';
    return 'امیدوارم شب آرامش‌بخشی داشته باشید';
  });

  // Smart assistant pro-active advisors
  const fetchSmartAiAnalysis = async (userMetrics: any, forceRefresh: boolean = false) => {
    const todayStr = selectedDateISO;

    // Read cache first unless forced
    if (!forceRefresh && typeof window !== "undefined") {
      const cached = localStorage.getItem(`sayeban_daily_ai_tip_${todayStr}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === todayStr && parsed.tip) {
            setAiTip(parsed.tip);
            return; // Exit early and use cache!
          }
        } catch (e) {
          // Fallback to fetch if cache parses wrong
        }
      }
    }

    // If it is forced, check and increment AI daily usage
    if (forceRefresh && !checkAndIncrementAiRequests()) {
      return;
    }

    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze', userData: { ...userMetrics, targetDate: todayStr }, customApiKey })
      });
      const data = await res.json();
      setAiTip(data.text);
      if (typeof window !== "undefined") {
        localStorage.setItem(`sayeban_daily_ai_tip_${todayStr}`, JSON.stringify({ date: todayStr, tip: data.text }));
        if (data.aiDailyLimit !== undefined) {
          localStorage.setItem('sayeban_ai_daily_limit', String(data.aiDailyLimit));
        }
      }
    } catch {
      setAiTip("آفرین بر شما! مصرف آب مناسبی دارید و وظایف خود را پیگیری می‌کنید. خواب عالی امشب ضامن ارتقای بهره‌وری فردای شماست.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  useEffect(() => {
    if (!userName || !selectedDateISO) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDateISO > todayStr) {
      setTimeout(() => setAiTip("روز انتخاب شده در آینده است! امکان تحلیل آینده وجود ندارد."), 0);
      return;
    }

    // Check if we have cached analysis for this selectedDateISO
    const cached = typeof window !== "undefined" ? localStorage.getItem(`sayeban_daily_ai_tip_${selectedDateISO}`) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === selectedDateISO && parsed.tip) {
          setTimeout(() => setAiTip(parsed.tip), 0);
          return; // Skip auto-generating since we have a cache!
        }
      } catch (e) {}
    }

    const analyzeData = {
      userName,
      waterToday: health.waterToday,
      sleepHours: health.sleepHours,
      sleepQuality: health.sleepQuality,
      moodScore: health.moodScore,
      weight: userWeight,
      completedTasksToday: tasks.filter(t => t.dueDate === selectedDateISO && t.status === 'done').length,
      pendingTasksToday: tasks.filter(t => t.dueDate === selectedDateISO && t.status !== 'done').length,
      totalMedicinesToday: medicines.length,
      completedMedicinesToday: medicines.filter(m => isMedicineCompleted(m)).length,
      totalHabitsToday: habits.length,
      completedHabitsToday: habits.filter(h => isHabitCompleted(h)).length,
    };

    // Use a slight timeout delay to completely isolate state updates from synchronous effect triggers
    const timer = setTimeout(() => {
      fetchSmartAiAnalysis(analyzeData, false);
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, selectedDateISO]);


  // Handle Smart Chat with Assistant
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (!checkAndIncrementAiRequests()) {
      return;
    }

    const userMsg = chatInput;
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput("");
    setIsAiResponding(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'command', 
          message: userMsg, 
          customApiKey,
          userData: { targetDate: selectedDateISO }
        })
      });
      const responseData = await res.json();
      
      setChatLog(prev => [...prev, { sender: 'assistant', text: responseData.text }]);
      if (typeof window !== "undefined" && responseData.aiDailyLimit !== undefined) {
        localStorage.setItem('sayeban_ai_daily_limit', String(responseData.aiDailyLimit));
      }

      // Check if Gemini parsed structured action commands
      if (responseData.actionData?.action && responseData.actionData?.payload) {
        const { action, payload } = responseData.actionData;
        if (action === "ADD_TASK") {
          const newTask: Task = {
            // eslint-disable-next-line react-hooks/purity
            id: crypto.randomUUID(),
            title: payload.title || "کار جدید",
            desc: payload.content || "",
            priority: payload.priority || "MEDIUM",
            status: "todo",
            dueDate: payload.dueDate || selectedDateISO
          };
          saveTasksToLocal([...tasks, newTask]);
          showToast(`وظیفه جدید ثبت گردید: ${newTask.title}`, "success");
        } else if (action === "ADD_EVENT") {
          const newEv: CalendarEvent = {
            // eslint-disable-next-line react-hooks/purity
            id: crypto.randomUUID(),
            title: payload.title || "رویداد جدید",
            desc: "افزوده شده توسط دستیار هوشمند",
            date: payload.date || selectedDateISO,
            time: payload.time || "12:00",
            category: "work",
            recurrence: "none"
          };
          saveEventsToLocal([...events, newEv]);
          showToast(`رویداد جدید به تقویم پیوست شد: ${newEv.title}`, "success");
        } else if (action === "ADD_NOTE") {
          const newNote: Note = {
            // eslint-disable-next-line react-hooks/purity
            id: crypto.randomUUID(),
            title: payload.title || "یادداشت جدید هوشمند",
            content: payload.content || "محتوا...",
            folder: "هوشمند",
            tags: ["هوشمند"],
            isPinned: false,
            updatedAt: selectedDateISO
          };
          saveNotesToLocal([...notes, newNote]);
          setActiveNoteId(newNote.id);
          showToast(`یادداشت جدید مکتوب شد: ${newNote.title}`, "success");
        }
      }
    } catch {
      setChatLog(prev => [...prev, { sender: 'assistant', text: "با موفقیت سناریوی شما را بررسی کردم اما مشکلی در تجزیه هوش مصنوعی پیش آمد." }]);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Floating NLP Command Quick Add Action
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;
    
    if (!checkAndIncrementAiRequests()) {
      return;
    }

    setQuickAddResult("در حال تجزیه دستور به صورت آنی...");
    
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'command', 
          message: quickAddText, 
          customApiKey,
          userData: { targetDate: selectedDateISO }
        })
      });
      const data = await res.json();
      
      if (typeof window !== "undefined" && data.aiDailyLimit !== undefined) {
        localStorage.setItem('sayeban_ai_daily_limit', String(data.aiDailyLimit));
      }
      
      if (data.actionData?.action && data.actionData?.payload) {
        const { action, payload } = data.actionData;
        if (action === "ADD_TASK") {
          const newTask: Task = {
            // eslint-disable-next-line react-hooks/purity
            id: crypto.randomUUID(),
            title: payload.title,
            desc: payload.content || "",
            priority: payload.priority || "MEDIUM",
            status: "todo",
            dueDate: payload.dueDate || selectedDateISO
          };
          saveTasksToLocal([...tasks, newTask]);
          setQuickAddResult(`✅ وظیفه جدید با موفقیت اضافه فرم شد: "${payload.title}" برای تاریخ ${payload.dueDate || selectedDateISO}`);
          showToast("کار جدید به هاب کایزن متصل شد!", "success");
        } else if (action === "ADD_EVENT") {
          const newEv: CalendarEvent = {
            // eslint-disable-next-line react-hooks/purity
            id: crypto.randomUUID(),
            title: payload.title,
            desc: "ثبت هوشمند کورتکس",
            date: payload.date || selectedDateISO,
            time: payload.time || "12:00",
            category: "work",
            recurrence: "none"
          };
          saveEventsToLocal([...events, newEv]);
          setQuickAddResult(`📅 رویداد جدید به تقویم اضافه گردید: "${payload.title}" در ساعت ${payload.time}`);
          showToast("رویداد جدید به تقویم الحاق شد!", "success");
        } else if (action === "ADD_NOTE") {
          const newNote: Note = {
            // eslint-disable-next-line react-hooks/purity
            id: crypto.randomUUID(),
            title: payload.title,
            content: payload.content || "",
            folder: "برنامه‌ها",
            tags: ["هوشmend"],
            isPinned: false,
            updatedAt: selectedDateISO
          };
          saveNotesToLocal([...notes, newNote]);
          setActiveNoteId(newNote.id);
          setQuickAddResult(`📝 یادداشت جدیدی تحت عنوان "${payload.title}" ثبت شد.`);
          showToast("یادداشت جدید با موفقیت مکتوب شد!", "success");
        } else {
          setQuickAddResult(`🧠 پیغام شما یک فرمان ثبتی نبود اما در چت سایبان پاسخ داده شد: "${data.text}"`);
        }
      } else {
        setQuickAddResult(`💬 هوش سایبان: "${data.text}"`);
      }
    } catch {
      setQuickAddResult("خطایی در ارتباط به موتور اصلی کورتکس گوگل ا رخ داد.");
    }
  };

  // Simple keydown listener to trigger AI command dialog with '/' key or Command Palette with Ctrl+K
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      // Toggle Quick Add (Ctrl+Q)
      if (e.key === 'q' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowQuickAdd(prev => !prev);
        playAudioFeedback('click');
      }
      // Toggle Command Palette (Ctrl+K or Cmd+K)
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
        playAudioFeedback('click');
      }
      // Esc to close overlays
      if (e.key === 'Escape') {
        setIsCmdPaletteOpen(false);
        setShowQuickAdd(false);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

  // Zen Block Ticking Engine with Experience rewards
  useEffect(() => {
    let interval: any = null;
    if (isZenTimerRunning) {
      interval = setInterval(() => {
        setZenTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsZenTimerRunning(false);
            playAudioFeedback('zen_finish');
            if (zenTimerType === 'focus') {
              const gainedXp = Math.max(10, Math.round(zenFocusDuration));
              earnXp(gainedXp, `تکمیل یک بلوک تمرکز کایزن ${zenFocusDuration} دقیقه‌ای 🧘`);
              showToast("بسیار عالی! زمان تمرکز با موفقیت پایان یافت. کمی استراحت کنید.", "success");
              setZenTimerType('break');
              return zenBreakDuration * 60; // customizable break
            } else {
              showToast("زمان استراحت پایان یافت. آماده تمرکز دوباره هستید؟", "info");
              setZenTimerType('focus');
              return zenFocusDuration * 60; // customizable focus
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isZenTimerRunning, zenTimerType, zenFocusDuration, zenBreakDuration]);

  const stopZenAmbientAudio = () => {
    if (customAudioRef.current) {
      try {
        customAudioRef.current.pause();
        customAudioRef.current.onended = null;
      } catch (err) {}
      customAudioRef.current = null;
    }
  };

  const startZenAmbientAudio = (catId: string, trackIdx: number) => {
    stopZenAmbientAudio();
    if (typeof window === 'undefined') return;

    const category = zenCategories.find((c: any) => c.id === catId);
    if (!category || !category.tracks || category.tracks.length === 0) {
      return;
    }

    const track = category.tracks[trackIdx];
    if (!track || !track.url) {
      return;
    }

    try {
      const audio = new Audio(track.url);
      audio.volume = 0.5;
      
      audio.onended = () => {
        if (zenAudioLoop === 'one') {
          startZenAmbientAudio(catId, trackIdx);
        } else if (zenAudioLoop === 'all') {
          const nextIdx = (trackIdx + 1) % category.tracks.length;
          setZenActiveTrackIndex(nextIdx);
          startZenAmbientAudio(catId, nextIdx);
        } else {
          setIsZenAudioPlaying(false);
        }
      };

      audio.play().catch(err => {
        console.warn("Audio play failed (waiting for user gesture):", err);
      });
      
      customAudioRef.current = audio;
    } catch (err) {
      console.error("Failed to play focus track:", err);
    }
  };

  const playNextZenTrack = () => {
    const category = zenCategories.find((c: any) => c.id === zenActiveCatId);
    if (!category || !category.tracks || category.tracks.length === 0) return;
    const nextIdx = (zenActiveTrackIndex + 1) % category.tracks.length;
    setZenActiveTrackIndex(nextIdx);
    if (isZenAudioPlaying) {
      startZenAmbientAudio(zenActiveCatId!, nextIdx);
    }
  };

  const playPrevZenTrack = () => {
    const category = zenCategories.find((c: any) => c.id === zenActiveCatId);
    if (!category || !category.tracks || category.tracks.length === 0) return;
    const prevIdx = (zenActiveTrackIndex - 1 + category.tracks.length) % category.tracks.length;
    setZenActiveTrackIndex(prevIdx);
    if (isZenAudioPlaying) {
      startZenAmbientAudio(zenActiveCatId!, prevIdx);
    }
  };

  useEffect(() => {
    if (isZenMode && isZenAudioPlaying && zenActiveCatId) {
      startZenAmbientAudio(zenActiveCatId, zenActiveTrackIndex);
    } else {
      stopZenAmbientAudio();
    }
    return () => {
      stopZenAmbientAudio();
    };
  }, [isZenMode, isZenAudioPlaying, zenActiveCatId, zenActiveTrackIndex]);

  // Form Adding Elements
  const addManualEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const item: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newEventTitle,
      desc: 'ثبت دستی رویداد در تقویم',
      date: newEventDate,
      time: newEventTime,
      category: newEventCat,
      recurrence: 'none'
    };
    saveEventsToLocal([...events, item]);
    setNewEventTitle("");
  };

  const addManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (isSelectedDatePast || isSelectedDateFuture) {
      showToast("برنامه‌ریزی و ثبت کارها تنها برای روز جاری ممکن است.", "error");
      return;
    }
    const item: Task = {
      // eslint-disable-next-line react-hooks/purity
      id: crypto.randomUUID(),
      title: newTaskTitle,
      desc: 'ایجاد دستی در پیشخوان کایزن',
      status: 'todo',
      priority: newTaskPriority,
      dueDate: selectedDateISO
    };
    saveTasksToLocal([...tasks, item]);
    setNewTaskTitle("");
  };

  const addManualHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const item: Habit = {
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      streak: 0,
      completedToday: false
    };
    saveHabitsToLocal([...habits, item]);
    setNewHabitName("");
    showToast(`عادت جدید افزوده شد: ${item.name}`, "success");
  };

  const deleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    saveHabitsToLocal(updated);
    showToast("عادت مورد نظر حذف گردید.", "info");
  };

  function isHabitCompleted(h: Habit) {
    return (h.completedDates || []).includes(selectedDateISO) || (h.completedToday && selectedDateISO === new Date().toISOString().split('T')[0]);
  }
  
  const toggleHabit = (id: string) => {
    if (isSelectedDatePast || isSelectedDateFuture) {
      showToast("امکان تغییر وضعیت عادات در گذشته یا آینده وجود ندارد.", "error");
      return;
    }
    let compl = false;
    let hName = "";
    const updated = habits.map(h => {
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
          completedToday: completed && selectedDateISO === new Date().toISOString().split('T')[0],
          streak: completed ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    });
    setHabits(updated);
    toggleHabitLog(id, selectedDateISO, compl).catch(console.error);
    showToast("وضعیت عادت با موفقیت تغییر کرد! 🔥", "success");
    if (compl) {
      earnXp(15, `تکمیل عادت سالم "${hName}"`);
    } else {
      earnXp(-15, `تکمیل عادت سالم "${hName}"`);
    }
  };

  const addManualMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;
    const item: Medicine = {
      id: crypto.randomUUID(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      time: newMedTime,
      completedDates: [],
      completedToday: false
    };
    saveMedicinesToLocal([...medicines, item]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedTime("08:00");
    showToast(`مکمل جدید ثبت شد: ${item.name}`, "success");
  };

  const deleteMedicine = (id: string) => {
    const updated = medicines.filter(m => m.id !== id);
    saveMedicinesToLocal(updated);
    showToast("یادآور مکمل با موفقیت حذف گردید.", "info");
  };

  function isMedicineCompleted(m: Medicine) {
    return (m.completedDates || []).includes(selectedDateISO) || (m.completedToday && selectedDateISO === todayISO);
  }

  const toggleMedicine = (id: string) => {
    if (isSelectedDatePast || isSelectedDateFuture) {
      showToast("امکان تغییر وضعیت مکمل‌ها در گذشته یا آینده وجود ندارد.", "error");
      return;
    }
    let earned = false;
    let name = "";
    const updated = medicines.map(m => {
      if (m.id === id) {
        const compl = !isMedicineCompleted(m);
        earned = compl;
        name = m.name;
        const dates = new Set(m.completedDates || []);
        if (compl) dates.add(selectedDateISO);
        else dates.delete(selectedDateISO);
        return { ...m, completedDates: Array.from(dates), completedToday: compl && selectedDateISO === todayISO };
      }
      return m;
    });
    saveMedicinesToLocal(updated);
    showToast("وضعیت مصرف یادآور قرص ثبت شد. 💊", "success");
    if (earned) {
      earnXp(10, `مصرف مکمل ${name}`);
    } else {
      earnXp(-10, `مصرف مکمل ${name}`);
    }
  };

  const createBlankNote = () => {
    const fresh: Note = {
      id: crypto.randomUUID(),
      title: 'یادداشت جدید بی‌نام',
      content: '# یادداشت جدید\n\nمتن یادداشت ارزشمند خود را در اینجا بنویسید...',
      folder: 'یادداشت‌ها',
      tags: ['کار'],
      isPinned: false,
      updatedAt: '25 خرداد ۱۴۰۵'
    };
    saveNotesToLocal([fresh, ...notes]);
    setActiveNoteId(fresh.id);
  };

  // Drag and Drop files for notes checklist attachments
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        fileNames.push(e.dataTransfer.files[i].name);
      }
      setNoteAttachments([...noteAttachments, ...fileNames]);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        fileNames.push(e.target.files[i].name);
      }
      setNoteAttachments([...noteAttachments, ...fileNames]);
    }
  };

  // Backup system exporting
  const exportBackupJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ events, notes, tasks, health, habits, medicines, profile: { userName } })
    );
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `sayeban_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const modifySelectedDate = (days: number) => {
    if (!selectedDateISO) return;
    const date = new Date(selectedDateISO + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() + days);
    setSelectedDateISO(date.toISOString().split('T')[0]);
  };

  // Filter components
  const activeNote = notes.find(n => n.id === activeNoteId);
  const filteredNotes = notes.filter(n => {
    const searchMatch = n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.content.toLowerCase().includes(noteSearch.toLowerCase());
    const folderMatch = selectedFolder === 'همه' || n.folder === selectedFolder;
    return searchMatch && folderMatch;
  });

  const fontStyleClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';

  return (
    <div className={`min-h-screen md:h-screen ${fontStyleClass} flex flex-col md:overflow-hidden bg-[#FAFCFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors`}>
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 shadow-sm" dir="rtl">
        <div 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-teal-500/10">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-black bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">سـایـبـان</h1>
            {customApiKey ? (
              <span className="text-[8px] text-teal-600 font-bold block">هوش مصنوعی متصل است 🟢</span>
            ) : (
              <span className="text-[8px] text-amber-500 font-medium block">حالت بهینه‌ساز دمو 🟡</span>
            )}
          </div>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-100 dark:border-slate-800 cursor-pointer"
        >
          {isMobileMenuOpen ? 'بستن منو ✕' : 'منوی ابزارها ☰'}
        </button>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-30 md:hidden" 
        />
      )}

      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        {/* Side Navigation Bar */}
        <aside className={`fixed inset-y-0 right-0 z-40 w-72 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between p-6 shrink-0 shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:flex md:shadow-sm md:h-full md:overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`} dir="rtl">
          <div>
          {/* Logo & Identity */}
          <div 
            className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">سـایـبـان</h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">برنامه‌ریز و دستیار پیشرفته سلامت</p>
            </div>
          </div>

          {/* User short profile info with Gamification Meter */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-4 mb-8 space-y-3 border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-teal-500/10">
                {userName[0]}
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">{userName}</h4>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-lg">سطح {level}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{useJalaliCalendar ? todayJalali : todayGregorian}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                <span>رشد کورتکس: {xpInCurrentLevel}/۱۰۰ XP</span>
                <span>کل: {xp} XP</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${xpInCurrentLevel}%` }}
                />
              </div>
              <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-relaxed text-center font-bold">
                🔥 {100 - xpInCurrentLevel} XP تا سطح {level + 1}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button 
              id="sidebar-btn-overview"
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='overview' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <Grid className="w-4.5 h-4.5" />
              <span>پیشخوان همه‌کاره</span>
            </button>

            <button 
              id="sidebar-btn-planner"
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='planner' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <Calendar className="w-4.5 h-4.5" />
              <span>تقویم و پلنر</span>
              <span className="mr-auto text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-sans">{events.length}</span>
            </button>

            <button 
              id="sidebar-btn-calendar"
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='calendar' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <Calendar className="w-4.5 h-4.5 text-indigo-500" />
              <span>بورد بزرگ تقویم</span>
              <span className="mr-auto text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-sans font-bold">جدید</span>
            </button>

            <button 
              id="sidebar-btn-notes"
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='notes' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              <span>یادداشت‌های من</span>
            </button>

            <button 
              id="sidebar-btn-tasks"
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='tasks' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <CheckSquare className="w-4.5 h-4.5" />
              <span>وظایف و کانبان</span>
              <span className="mr-auto text-[10px] bg-amber-150 text-amber-900 px-2 py-0.5 rounded-full font-sans">
                {tasks.filter(t=>t.status !== 'done').length}
              </span>
            </button>

            <button 
              id="sidebar-btn-health"
              type="button"
              onClick={() => setActiveTab('health')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='health' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <Activity className="w-4.5 h-4.5" />
              <span>تندرستی و عادات</span>
            </button>

            <button 
              id="sidebar-btn-brain-gym"
              type="button"
              onClick={() => setActiveTab('brain_gym')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='brain_gym' ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <Brain className="w-4.5 h-4.5 text-purple-500" />
              <span>باشگاه مغز (Brain Gym)</span>
              <span className="mr-auto text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-sans font-bold">جدید</span>
            </button>

            <button 
              id="sidebar-btn-settings"
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='settings' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>پیکربندی سامانه</span>
            </button>

            <button 
              id="sidebar-btn-support"
              type="button"
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab==='support' ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              <div className="relative">
                <MessageSquare className="w-4.5 h-4.5" />
                {hasUnreadTickets && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
                )}
              </div>
              <span>تیکت و پشتیبانی</span>
              {hasUnreadTickets && (
                <span className="mr-auto text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                  پاسخ جدید
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Action Bottom Layout */}
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-55 flex flex-col gap-1">
          {/* Immersive Zen/Pomodoro trigger */}
          <button 
            id="btn-trigger-zen-quick"
            type="button"
            onClick={() => {
              setIsZenMode(true);
              setIsZenAudioPlaying(true);
              setIsZenTimerRunning(true);
              playAudioFeedback('click');
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-xs rounded-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-rose-500/10"
          >
            <Moon className="w-4.5 h-4.5 animate-pulse" />
            <span>تمرکز مطلق کایزن (Zen Mode)</span>
          </button>

          {/* Quick AI Trigger button */}
          <button 
            id="btn-trigger-ai-quick"
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-extrabold text-xs rounded-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4.5 h-4.5 animate-spin" />
            <span>دستیار هوش مصنوعی</span>
          </button>

          <button 
            id="btn-sidebar-logout"
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج کامل</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full dark:bg-[#0B1120] md:dark:rounded-tl-3xl border-t border-r border-transparent dark:border-slate-800/50">
        
        {announcement && announcement.show && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start sm:items-center gap-3 text-sm font-medium shadow-sm
            ${announcement.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
              announcement.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 
              announcement.type === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' : 
              'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}
          >
            <Bell className={`w-5 h-5 shrink-0 mt-0.5 sm:mt-0 animate-pulse 
              ${announcement.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 
                announcement.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
                announcement.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 
                'text-blue-600 dark:text-blue-400'}`} 
            />
            <div className="flex-1 leading-relaxed">{announcement.text}</div>
            <button onClick={() => setAnnouncement(null)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors shrink-0">
              <X className="w-4 h-4 opacity-60" />
            </button>
          </div>
        )}

        {/* Horizontal Timeline Date Selector */}
        <div className="mb-6 flex items-center justify-between bg-white dark:bg-slate-900 px-2 py-2 sm:px-4 sm:py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" dir="rtl">
          {/* RTL Chronology: Right = Past, Left = Future */}
          {/* Right Arrow: Go towards past (-1) */}
          <button onClick={() => modifySelectedDate(-1)} className="p-1 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950 transition" title="روز قبل">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <div className="flex-1 flex justify-center items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar px-1">
            {Array.from({length: 7}).map((_, i) => {
              if (!selectedDateISO) return null;
              const d = new Date(selectedDateISO + "T12:00:00Z");
              // Render past on the right, future on the left. In RTL, index 0 is right.
              // So index 0 = -3 days, index 6 = +3 days.
              d.setUTCDate(d.getUTCDate() - 3 + i);
              const dateIsoStr = d.toISOString().split('T')[0];
              const isSelected = dateIsoStr === selectedDateISO;
              const isToday = dateIsoStr === todayISO;
              
              // Count tasks/events for this day
              const hasTask = tasks.some(t => t.dueDate === dateIsoStr);
              const hasEvent = events.some(e => e.date === dateIsoStr);
              
              const dayName = useJalaliCalendar 
                ? new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(d)
                : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
              
              const dayNumStr = useJalaliCalendar
                ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(d)
                : new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d);

              const monthName = useJalaliCalendar
                ? new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(d)
                : new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);

              return (
                <div 
                  key={dateIsoStr}
                  onClick={() => setSelectedDateISO(dateIsoStr)}
                  className={`flex flex-col items-center justify-center min-w-[38px] sm:min-w-[46px] py-1.5 sm:py-2 cursor-pointer rounded-xl transition-all ${isSelected ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : isToday ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'hover:bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-100 dark:border-slate-800'}`}
                >
                  <span className={`text-[8px] sm:text-[9px] mb-0.5 font-medium ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{dayName}</span>
                  <span className="text-sm sm:text-base font-black leading-none">{dayNumStr}</span>
                  <span className={`text-[8px] sm:text-[9px] mt-0.5 font-medium ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{monthName}</span>
                  <div className="flex gap-0.5 mt-1 h-1">
                    {hasTask ? <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-teal-200' : 'bg-rose-400'}`}></div> : <div className="w-1 h-1" />}
                    {hasEvent ? <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white dark:bg-slate-900' : 'bg-indigo-400'}`}></div> : <div className="w-1 h-1" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left Arrow: Go towards future (+1) */}
          <button onClick={() => modifySelectedDate(1)} className="p-1 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950 transition" title="روز بعد">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {isSelectedDatePast && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-850/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/60 flex items-center gap-3 text-xs font-semibold shadow-sm" dir="rtl">
            <span className="text-base text-amber-500">⚠️</span>
            <div>شما در حال مشاهده اطلاعات روز گذشته هستید. برای حفظ یکپارچگی ارزیابی‌ها، امکان تغییر یا ثبت مجدد داده‌های تندرستی (آب، خواب، خلق‌وخو، عادات و قرص‌ها) و وظایف برای گذشته وجود ندارد.</div>
          </div>
        )}

        {isSelectedDateFuture && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 flex items-center gap-3 text-xs font-semibold shadow-sm" dir="rtl">
            <span className="text-base">⚠️</span>
            <div>شما در حال مشاهده یک روز در آینده هستید. از آنجا که این روز هنوز فرانرسیده است، امکان ثبت یا تغییر داده‌های تندرستی، خواب، آب، عادات، قرص‌ها و وظایف برای آن وجود ندارد.</div>
          </div>
        )}

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row: Dynamic Greeting Speech Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-10 top-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <span className="text-xs bg-teal-500/20 text-teal-300 font-bold px-3 py-1 rounded-full uppercase">پیشخوان سلامت و کورتکس</span>
                <h1 className="text-2xl sm:text-3xl font-black mt-3 mb-2">{userName} عزیز، {greeting}</h1>
                <p className="text-xs text-slate-350">{useJalaliCalendar ? selectedDateJalali : selectedDateGregorian} | شما در این روز {tasks.filter(t=>t.status === 'done' && t.dueDate === selectedDateISO).length} کار کورتکس را تکمیل کردید.</p>
              </div>
            </div>

            {/* Smart Ai Advice Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>توصیه و تحلیل امروز دستیار سایبان</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">Gemini live</span>
                    </h3>
                    <button 
                      title={selectedDateISO > todayISO ? "امکان تحلیل برای روزهای آینده وجود ندارد" : "به‌روزرسانی تحلیل هوشمند"}
                      disabled={selectedDateISO > todayISO || isAnalyzingAi}
                      onClick={() => fetchSmartAiAnalysis({ 
                        userName, 
                        waterToday: health.waterToday, 
                        sleepHours: health.sleepHours,
                        sleepQuality: health.sleepQuality,
                        moodScore: health.moodScore,
                        weight: userWeight,
                        completedTasksToday: tasks.filter(t => t.dueDate === selectedDateISO && t.status === 'done').length,
                        pendingTasksToday: tasks.filter(t => t.dueDate === selectedDateISO && t.status !== 'done').length,
                        totalMedicinesToday: medicines.length,
                        completedMedicinesToday: medicines.filter(m => isMedicineCompleted(m)).length,
                        totalHabitsToday: habits.length,
                        completedHabitsToday: habits.filter(h => isHabitCompleted(h)).length,
                      }, true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:bg-slate-950 cursor-pointer transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'animate-spin text-teal-500' : ''}`} />
                    </button>
                  </div>
                  {isAnalyzingAi ? (
                    <p className="text-xs text-slate-400 font-mono italic animate-pulse">در حال فراخوانی موتور عصبی گوگل با مشخصات تغذیه و کارهای امروزِ شما...</p>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{aiTip}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Zen Mode Launcher Section */}
            <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-rose-500/10 p-5 rounded-3xl border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-4 text-right" dir="rtl">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-2xl shadow-md animate-pulse">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">حالت تمرکز مطلق و تکنیک پومودورو کایزن (Zen Mode)</h3>
                  <p className="text-[10px] text-slate-550 leading-relaxed font-bold mt-1">
                    ذهن خود را متمرکز کنید و با موسیقی‌های اتمسفریک شبیه‌سازی‌شده (جنگل بارانی، آسمان کوانتومی، آتشدان دنج، فرکانس شفا بخش ۵۲۸ هرتز) از حواس‌پرت‌کن‌ها رها شوید.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsZenMode(true);
                  setIsZenAudioPlaying(true);
                  setIsZenTimerRunning(true);
                  playAudioFeedback('click');
                }}
                className="whitespace-nowrap bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md shadow-rose-500/15"
              >
                راه اندازی زنگ کایزن و تمرکز مطلق 🧘
              </button>
            </div>

            {/* Quad Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Quick Hydration Track Widget */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">مصرف آب امروز</span>
                  <Droplet className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-center py-2">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{health.waterToday} <span className="text-xs font-normal text-slate-400">میلی‌لیتر</span></h4>
                  <p className="text-[10px] text-teal-650 font-bold mt-1">طرح هدف: ۲۵۰۰ میلی‌لیتر</p>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button 
                    disabled={isSelectedDatePast || isSelectedDateFuture}
                    onClick={() => saveHealthToLocal({ ...health, waterToday: health.waterToday + 250 })}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + ۲۵۰ml
                  </button>
                  <button 
                    disabled={isSelectedDatePast || isSelectedDateFuture}
                    onClick={() => saveHealthToLocal({ ...health, waterToday: health.waterToday + 500 })}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + ۵۰۰ml
                  </button>
                </div>
              </div>

              {/* Sleep Quality Widget */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">میزان خواب</span>
                  <Moon className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-center py-2">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{health.sleepHours} <span className="text-xs font-normal text-slate-400">ساعت</span></h4>
                  <p className="text-[10px] text-indigo-500 font-bold mt-1">کیفیت: {health.sleepQuality === 'excellent' ? 'بسیار عالی' : health.sleepQuality === 'good' ? 'خوب و رضایت‌بخش' : 'متوسط'}</p>
                </div>
                <input 
                  type="range" 
                  min="4" 
                  max="12" 
                  disabled={isSelectedDatePast || isSelectedDateFuture}
                  value={health.sleepHours} 
                  onChange={(e) => saveHealthToLocal({ ...health, sleepHours: Number(e.target.value) })}
                  className="w-full mt-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              {/* Mood Tracker Widget */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">خلق‌وخوی امروز</span>
                  <Smile className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex justify-center gap-1.5 py-3">
                  {[1, 2, 3, 4, 5].map(score => {
                    const emojis = ["😡", "😔", "😐", "😊", "🤩"];
                    return (
                      <button 
                        key={score}
                        disabled={isSelectedDatePast || isSelectedDateFuture}
                        onClick={() => saveHealthToLocal({ ...health, moodScore: score })}
                        className={`text-lg p-1.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${health.moodScore === score ? 'bg-emerald-50 scale-120 border border-emerald-250' : 'opacity-50 hover:opacity-100'}`}
                        title={emojis[score-1]}
                      >
                        {emojis[score-1]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-[10px] font-bold text-slate-400 mt-1">امتیاز ثبت شده: {health.moodScore} از ۵</p>
              </div>

              {/* Weight BMI Status Tracker */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400 font-bold">وزن و شاخص BMI</span>
                  <Heart className="w-5 h-5 text-rose-500" />
                </div>
                <div className="text-center py-2">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{userWeight} <span className="text-xs font-normal text-slate-400">کیلوگرم</span></h4>
                  {(() => {
                    const heightInMeters = userHeight / 100;
                    const bmi = Number((userWeight / (heightInMeters * heightInMeters)).toFixed(1)) || 0;
                    let bmiState = "نرمال (ایده‌آل)";
                    if (bmi < 18.5) bmiState = "کمبود وزن (لاغر)";
                    else if (bmi >= 25 && bmi < 30) bmiState = "اضافه‌وزن";
                    else if (bmi >= 30) bmiState = "چاق کورتکس";
                    return <p className="text-[10px] text-rose-650 font-bold mt-1">شاخص توده: {bmi} ({bmiState})</p>;
                  })()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => saveUserWeight(Number((userWeight - 0.5).toFixed(1)))} className="text-xs font-bold p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded cursor-pointer">-0.5</button>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: '65%' }} />
                  </div>
                  <button onClick={() => saveUserWeight(Number((userWeight + 0.5).toFixed(1)))} className="text-xs font-bold p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded cursor-pointer">+0.5</button>
                </div>
              </div>
            </div>

            {/* Sub-grid of Events and Checked Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel Today’s Events */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <span>برنامه و قرار ملاقات‌های امروز</span>
                  </h3>
                  <button onClick={() => setActiveTab('planner')} className="text-xs text-teal-600 font-bold hover:underline">دیدن تقویم کامل</button>
                </div>
                
                <div className="space-y-3">
                  {events.filter(e => e.date === selectedDateISO).map(ev => (
                    <div key={ev.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between border-r-4 border-teal-500">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{ev.time}</span>
                        <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{ev.title}</h5>
                      </div>
                      <span className="text-[10px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 font-semibold">{ev.category}</span>
                    </div>
                  ))}
                  {events.filter(e => e.date === selectedDateISO).length === 0 && (
                    <div className="text-center py-8 text-slate-405 italic text-xs">رویدادی برای این تاریخ مقرر نشده است.</div>
                  )}
                </div>
              </div>

              {/* Right Panel Today’s Tasks */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                    <span>کارهای اولویت‌دار امروز</span>
                  </h3>
                  <button onClick={() => setActiveTab('tasks')} className="text-xs text-emerald-600 font-bold hover:underline">مشاهده بورد کانبان</button>
                </div>

                <div className="space-y-3">
                  {tasks.filter(t => t.status !== 'done' && t.dueDate === selectedDateISO).slice(0, 3).map(task => (
                    <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          onChange={() => {
                            const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'done' as const } : t);
                            saveTasksToLocal(updated);
                            earnXp(20, `تکمیل کار "${task.title}"`);
                          }}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer border-slate-300 dark:border-slate-600"
                        />
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{task.title}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>
                        {task.priority === 'HIGH' ? 'مهم' : 'عادی'}
                      </span>
                    </div>
                  ))}
                  {tasks.filter(t => t.status !== 'done' && t.dueDate === selectedDateISO).length === 0 && (
                    <div className="text-center py-8 text-slate-405 italic text-xs">کارهای این روز با موفقیت تکمیل شده است. 🎉</div>
                  )}
                </div>
              </div>
            </div>

            {/* Smart Voice Chatbot Interface Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span>دستیار هوشمند و فهم فرمان‌های کورتکس (Gemini AI Support)</span>
              </h2>
              
              <div className="h-64 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 mb-4 border border-slate-100 dark:border-slate-800/50 space-y-3.5">
                <AnimatePresence>
                  {chatLog.map((log, index) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      transition={{ duration: 0.2 }}
                      key={index} 
                      className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${log.sender === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-150 text-slate-700 dark:text-slate-300 rounded-bl-none'}`}>
                        {log.text}
                      </div>
                    </motion.div>
                  ))}
                  {isAiResponding && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 p-3 rounded-xl rounded-bl-none text-xs italic animate-pulse">
                        دستیار سایبان در حال اندیشیدن...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input 
                  type="text"
                  required
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="سر فصلی اضافه کنید یا با چت ربات مشورت کنید... (مثل: من چطور می‌توانم استرسم را کاهش دهم؟)"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
                
                {/* Simulated Speech Button */}
                <button 
                  type="button"
                  onClick={() => {
                    const sampleCommand = "جلسه با مدیر ساعت ۱۵ فردا هماهنگ شه";
                    setChatInput(sampleCommand);
                    showToast(`دستور آزمایشی بارگذاری شد: "${sampleCommand}". روی ارسال کلیک نمایید.`, "info");
                  }}
                  className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl cursor-pointer"
                  title="شبیه‌ساز ضبط صدا"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button 
                  type="submit"
                  className="bg-teal-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-teal-700 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  ارسال پیام
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Calendar & Planner */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">تقویم زمان‌بندی و مسدودسازی زمانی (Time Blocking)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">کارهای امروز کایزن خود را با اسلات‌های تقویم پیوند دهید تا بهره‌وری دوچندان داشته باشید.</p>
              </div>

              <button 
                onClick={() => setUseJalaliCalendar(!useJalaliCalendar)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-950 cursor-pointer"
              >
                نمایش تقویم: {useJalaliCalendar ? 'جلالی (شمسی)' : 'میلادی (Gregorian)'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Maker Panel */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-extrabold text-sm mb-4 text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-50">درج رویداد جدید به تقویم</h3>
                
                <form onSubmit={addManualEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">عنوان قرار ملاقات / رویداد</label>
                    <input 
                      type="text" 
                      required
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="مثال: دندان‌پزشکی، سینما"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تاریخ</label>
                      <DatePicker 
                        calendar={persian}
                        locale={persian_fa}
                        format="YYYY/MM/DD"
                        value={newEventDate ? new Date(newEventDate + 'T12:00:00') : ""}
                        onChange={(date: any) => {
                          if (date) {
                            const jsDate = date.toDate();
                            // Prevent timezone offset issue by formatting using local time
                            const yy = jsDate.getFullYear();
                            const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(jsDate.getDate()).padStart(2, '0');
                            setNewEventDate(`${yy}-${mm}-${dd}`);
                          }
                        }}
                        containerClassName="w-full"
                        inputClass="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-center"
                        placeholder="انتخاب تاریخ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">ساعت شروع</label>
                      <input 
                        type="time" 
                        required
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">دسته‌بندی کاری</label>
                    <select 
                      value={newEventCat} 
                      onChange={(e) => setNewEventCat(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    >
                      <option value="work">کارهای شغلی / اداری</option>
                      <option value="personal">مسائل شخصی</option>
                      <option value="health">سلامت و ورزش</option>
                      <option value="learning">مطالعه و پژوهش</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 cursor-pointer"
                  >
                    ثبت در تقویم سایبان
                  </button>
                </form>
              </div>

              {/* Central Grid: Days Representation */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نمای ۵ روزه پیرامون تاریخ انتخاب شده</span>
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" title="Work" />
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" title="Personal" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Health" />
                  </div>
                </div>

                {/* Days Representation Columns simulated Row */}
                <div className="space-y-3">
                  {Array.from({length: 5}).map((_, i) => {
                    if (!selectedDateISO) return "";
                    const d = new Date(selectedDateISO + "T12:00:00Z");
                    d.setUTCDate(d.getUTCDate() - 2 + i);
                    return d.toISOString().split('T')[0];
                  }).filter(Boolean).map(dateStr => {
                    const isToday = dateStr === todayISO;
                    const dailyEvents = events.filter(e => e.date === dateStr);
                    return (
                      <div 
                        key={dateStr} 
                        className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-colors ${isToday ? 'bg-teal-50/40 border-teal-300' : 'bg-slate-50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800'}`}
                      >
                        <div className="shrink-0">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{useJalaliCalendar ? getJalaliDate(dateStr) : dateStr}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">{isToday && '(امروز کورتکس)'}</span>
                        </div>

                        <div className="flex-1 flex flex-wrap gap-2">
                          {dailyEvents.map(ev => {
                            const colors = ev.category === 'health' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : ev.category === 'work' ? 'bg-teal-55 bg-teal-50 text-teal-800 border-teal-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200';
                            return (
                              <div 
                                key={ev.id} 
                                className={`px-2.5 py-1 text-xs rounded-xl border flex items-center gap-2 ${colors}`}
                              >
                                <span className="font-mono text-[9px] font-bold">{ev.time}</span>
                                <span className="font-medium font-sans">{ev.title}</span>
                                <button 
                                  onClick={() => saveEventsToLocal(events.filter(e => e.id !== ev.id))}
                                  className="text-slate-450 hover:text-rose-500"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                          {dailyEvents.length === 0 && (
                            <span className="text-xs text-slate-400 italic">بدون قرار کاری یا ورزشی</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Rich Notes Module */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">دفترچه یادداشت‌های کورتکس من</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">اسناد، ایده‌ها و رویاهای خود را در پوشه‌های گوناگون با چسبندگی مینی‌مال ذخیره کنید.</p>
              </div>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowNotesGraph(prev => !prev);
                    playAudioFeedback('click');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${showNotesGraph ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}`}
                  title="نمایش نمایه ارتباطات هوشمند بین یادداشت‌ها"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>نمای گراف روابط Obsidian</span>
                </button>

                <button 
                  onClick={createBlankNote}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-teal-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>یادداشت جدید</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {showNotesGraph ? (
                <div className="md:col-span-2 space-y-4 animate-fadeIn">
                  {(() => {
                    const radius = 100;
                    const cx = 180;
                    const cy = 180;
                    const mappedNodes = notes.map((note, index) => {
                      const angle = (index / (notes.length || 1)) * 2 * Math.PI;
                      return {
                        id: note.id,
                        title: note.title,
                        isPinned: note.isPinned,
                        x: cx + radius * Math.cos(angle),
                        y: cy + radius * Math.sin(angle)
                      };
                    });

                    const edges: { from: {x:number, y:number, id:string}, to: {x:number, y:number, id:string} }[] = [];
                    for (let i = 0; i < mappedNodes.length; i++) {
                      for (let j = i + 1; j < mappedNodes.length; j++) {
                        const nodeA = notes[i];
                        const nodeB = notes[j];
                        const posA = mappedNodes[i];
                        const posB = mappedNodes[j];
                        
                        const linkAtoB = nodeA.content.includes(`[[${nodeB.title}]]`) || nodeA.content.includes(nodeB.title);
                        const linkBtoA = nodeB.content.includes(`[[${nodeA.title}]]`) || nodeB.content.includes(nodeA.title);
                        
                        const overlapping = (nodeA.title && nodeB.title && nodeA.title.slice(0, 3) === nodeB.title.slice(0, 3));

                        if (linkAtoB || linkBtoA || overlapping) {
                          edges.push({ from: posA, to: posB });
                        }
                      }
                    }

                    return (
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center shadow-inner min-h-[460px] flex flex-col justify-between overflow-hidden relative">
                        <div className="flex justify-between items-center z-10">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-cyan-400 block tracking-widest uppercase">نمایش روابط هوشمند</span>
                            <h4 className="text-xs font-black text-white">شبکه روابط یادداشت‌ها کورتکس</h4>
                          </div>
                          <span className="text-[9px] bg-slate-800 border border-slate-700 text-teal-400 py-0.5 px-2 rounded-full font-mono">
                            پیوندها: {edges.length} | یادداشت‌ها: {notes.length}
                          </span>
                        </div>

                        <div className="relative w-full flex-1 flex items-center justify-center min-h-[290px]">
                          <svg className="w-full h-full max-w-[340px] max-h-[300px] drop-shadow-[0_0_15px_rgba(20,184,166,0.12)]">
                            {edges.map((e, idx) => (
                              <line 
                                key={`link-${idx}`} 
                                x1={e.from.x} 
                                y1={e.from.y} 
                                x2={e.to.x} 
                                y2={e.to.y} 
                                stroke="#14B8A6" 
                                strokeWidth="1.2" 
                                strokeOpacity="0.45"
                                strokeDasharray="3 3"
                              />
                            ))}

                            {mappedNodes.map((n) => {
                              const isActive = n.id === activeNoteId;
                              return (
                                <g 
                                  key={n.id} 
                                  className="cursor-pointer group"
                                  onClick={() => {
                                    setActiveNoteId(n.id);
                                    playAudioFeedback('click');
                                    showToast(`تمرکز یادداشت روی: "${n.title}"`, "info");
                                  }}
                                >
                                  <circle 
                                    cx={n.x} 
                                    cy={n.y} 
                                    r={isActive ? "9" : "6"} 
                                    fill={isActive ? "#14B8A6" : "#475569"} 
                                    stroke={isActive ? "#CCFBF1" : "#1E293B"}
                                    strokeWidth="1.5"
                                    className="transition-all duration-300 hover:fill-teal-400"
                                  />
                                  
                                  <text 
                                    x={n.x} 
                                    y={n.y - 11} 
                                    textAnchor="middle" 
                                    fill={isActive ? "#2DD4BF" : "#94A3B8"} 
                                    className="text-[8px] font-black pointer-events-none select-none font-sans"
                                  >
                                    {n.title.slice(0, 16)}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>

                        <p className="text-[9.5px] text-slate-400 text-center leading-normal">
                          💡 گره‌ها را لمس کنید تا یادداشت فعال تغییر کند. برای بازگشت به لیست ستونی دکمه بالا را کلیک کنید.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <>
                  {/* Folders List and Search panel */}
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="relative">
                        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="جستجو در متون..."
                          value={noteSearch}
                          onChange={(e) => setNoteSearch(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">پوشه‌بندی</span>
                      {['همه', 'یادداشت‌ها', 'برنامه‌ها', 'هوشمند'].map(f => (
                        <button 
                          key={f}
                          onClick={() => setSelectedFolder(f)}
                          className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${selectedFolder === f ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note Selection List */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 overflow-y-auto max-h-[500px] space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2 px-1">لیست نوشته‌ها</span>
                    <AnimatePresence mode="popLayout">
                      {filteredNotes.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6 text-slate-400">
                          <BookOpen className="w-8 h-8 opacity-20 mx-auto mb-2" />
                          <span className="text-[10px]">نوشته‌ای یافت نشد</span>
                        </motion.div>
                      )}
                      {filteredNotes.map(n => (
                        <motion.button 
                          layout
                          initial={{ opacity: 0, scale: 0.95 }} 
                          animate={{ opacity: 1, scale: 1 }} 
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          key={n.id}
                          onClick={() => setActiveNoteId(n.id)}
                          className={`w-full text-right p-3 rounded-xl border cursor-pointer transition-colors block ${activeNoteId === n.id ? 'bg-teal-50/40 border-teal-300' : 'bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:bg-slate-950'}`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{n.title}</h4>
                            {n.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-1">{n.content.slice(0, 40)}...</p>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Active Note Rich Editor */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:col-span-2 space-y-4">
                {activeNote ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <input 
                        type="text"
                        value={activeNote.title}
                        onChange={(e) => {
                          const updated = notes.map(n => n.id === activeNote.id ? { ...n, title: e.target.value } : n);
                          saveNotesToLocal(updated);
                        }}
                        className="font-black text-base text-slate-900 dark:text-slate-100 focus:outline-none bg-transparent flex-1"
                      />

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const updated = notes.map(n => n.id === activeNote.id ? { ...n, isPinned: !n.isPinned } : n);
                            saveNotesToLocal(updated);
                          }}
                          className={`p-2 rounded-lg hover:bg-slate-50 dark:bg-slate-950 ${activeNote.isPinned ? 'text-amber-500' : 'text-slate-450'}`}
                          title="پین یا لغو قرار گرفتن در بالای نوشته‌ها"
                        >
                          <Pin className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => {
                            const updated = notes.filter(n => n.id !== activeNote.id);
                            saveNotesToLocal(updated);
                            setActiveNoteId(updated[0]?.id || null);
                          }}
                          className="p-2 rounded-lg text-slate-450 hover:text-rose-500 hover:bg-rose-50"
                          title="حذف دائمی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <textarea 
                      value={activeNote.content}
                      onChange={(e) => {
                        const updated = notes.map(n => n.id === activeNote.id ? { ...n, content: e.target.value } : n);
                        saveNotesToLocal(updated);
                      }}
                      className="w-full h-80 focus:outline-none p-3 resize-none text-xs rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 font-mono focus:border-teal-500 leading-relaxed text-slate-700 dark:text-slate-300"
                    />

                    {/* Integrated Templates Row */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">قالب‌های کورتکس:</span>
                      {[
                        { name: '📝 روزنگار', template: '# روزنگار هوشمند کایزن\n\n## 🌟 سپاسگزاری امروز:\n۱. \n۲. \n\n## 🎯 تمرکز کاری امروز:\n- \n\n## 💭 بازتاب احساسی:\n' },
                        { name: '💼 جلسه', template: '# یادداشت جلسه کورتکس\n\n**موضوع:** \n**تاریخ:** \n**حاضرین:** \n\n## 📝 نکات کلیدی:\n- \n\n## 📌 اکشن آیتم‌ها:\n- [ ] پیگیری کار تیم' },
                        { name: '📖 کتاب', template: '# خلاصه کتاب جدید\n\n**عنوان:** \n**نویسنده:** \n\n## 💡 آموخته‌های کلیدی:\n۱. \n\n## 🎯 اقدام عملی:\n- ' },
                        { name: '💡 ایده', template: '# بوم طوفان فکری ایده\n\n**فرضیه اصلی:** \n**ارزش پیشنهادی:** \n\n## 🚀 گام اقدام:\n- [ ] تست ایده ' }
                      ].map(tmpl => (
                        <button
                          key={tmpl.name}
                          type="button"
                          onClick={() => {
                            const updated = notes.map(n => n.id === activeNote.id ? { ...n, content: tmpl.template } : n);
                            saveNotesToLocal(updated);
                            earnXp(15, `بکارگیری قالب هوشمند "${tmpl.name}"`);
                            showToast(`قالب "${tmpl.name}" اعمال شد!`, "success");
                          }}
                          className="px-2 py-0.5 bg-white dark:bg-slate-900 hover:bg-teal-50 border border-slate-200 dark:border-slate-700 hover:border-teal-300 rounded text-[9px] font-bold transition-all cursor-pointer"
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>

                    {/* Integrated Back-links Tracker */}
                    {(() => {
                      const backlinks = notes.filter(n => n.id !== activeNote.id && (n.content.includes(activeNote.title) || n.content.includes(`[[${activeNote.title}]]`)));
                      if (backlinks.length > 0) {
                        return (
                          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/65 mt-2">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1.5 font-sans">🔗 نوشته‌های ارجاع‌دهنده به این سند (Backlinks):</span>
                            <div className="flex flex-wrap gap-1.5">
                              {backlinks.map(bl => (
                                <button
                                  key={bl.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveNoteId(bl.id);
                                    playAudioFeedback('click');
                                  }}
                                  className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-650 hover:text-teal-700 px-2 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  {bl.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Integrated Drag-and-Drop Attachment Block */}
                    <div className="space-y-3 pt-3 border-t border-slate-50">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">پیوست تصاویر و اسناد ایده (Drag & Drop)</span>
                      
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${isDragOver ? 'border-teal-500 bg-teal-50/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950/40'}`}
                      >
                        <Upload className="w-6 h-6 text-slate-450 mx-auto mb-2" />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">فایل خود را به اینجا بکشید یا برای انتخاب کلیک کنید.</p>
                        <input 
                          type="file" 
                          multiple 
                          ref={fileInputRef} 
                          onChange={handleManualFileSelect}
                          className="hidden" 
                        />
                      </div>

                      {noteAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {noteAttachments.map((file, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                              <span>{file}</span>
                              <button onClick={() => setNoteAttachments(noteAttachments.filter((_, idx)=>idx !== i))} className="text-slate-450 hover:text-rose-500">✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-405 italic text-sm">یادداشتی انتخاب نشده است. یکی ساخته یا از ستون راست انتخاب بفرمایید.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Tasks Section with Kanban list board */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">بورد کارهای من (آسان کایزن و کانبان)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">کارهای در دست اقدام، به بهره‌وری منظم و پایش‌های اولویت‌دار ملحق کنید تا اهداف حاصل شوند.</p>
              </div>

              {/* Quick Task Adding form bar */}
              <form onSubmit={addManualTask} className="flex gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <input 
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="افزودن کار تازه..."
                  className="px-3 py-1.5 rounded-xl border border-slate-150 text-xs focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
                
                <select 
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs border border-slate-150 text-slate-700 dark:text-slate-300"
                >
                  <option value="HIGH">اولویت بالا</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="LOW">پایین</option>
                </select>

                <button 
                  type="submit"
                  className="bg-teal-600 text-white text-xs font-bold px-4.5 py-1.5 rounded-xl hover:bg-teal-700 cursor-pointer"
                >
                  درج وظیفه
                </button>
              </form>
            </div>

            {/* Simulated interactive Kanban columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ToDo Column */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-150 mb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-505 bg-indigo-500" />
                    <span>کارهای مانده</span>
                  </span>
                  <span className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">{tasks.filter(t=>t.status === 'todo' && t.dueDate === selectedDateISO).length}</span>
                </div>

                <AnimatePresence mode="popLayout">
                  {tasks.filter(t => t.status === 'todo' && t.dueDate === selectedDateISO).length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2"><CheckSquare className="w-4 h-4 text-slate-300" /></div>
                      <span className="text-[10px]">کارهایتان را اینجا وارد کنید</span>
                    </motion.div>
                  )}
                  {tasks.filter(t => t.status === 'todo' && t.dueDate === selectedDateISO).map(task => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150/40 shadow-sm relative group space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-normal">{task.title}</h4>
                        <button 
                          onClick={() => saveTasksToLocal(tasks.filter(t=>t.id !== task.id))}
                          className="text-slate-350 hover:text-rose-500 opacity-60 hover:opacity-100 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">{useJalaliCalendar ? getJalaliDate(task.dueDate) : task.dueDate}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50/50">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {task.priority === 'HIGH' ? 'مهم' : 'عادی'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'doing' as const } : t);
                            saveTasksToLocal(updated);
                          }}
                          className="text-[9px] font-black text-teal-600 hover:underline bg-teal-50 px-2.5 py-1 rounded"
                        >
                          حرکت به اقدام →
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Doing Column */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-150 mb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>در دست اقدام</span>
                  </span>
                  <span className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">{tasks.filter(t=>t.status === 'doing' && t.dueDate === selectedDateISO).length}</span>
                </div>

                <AnimatePresence mode="popLayout">
                  {tasks.filter(t => t.status === 'doing' && t.dueDate === selectedDateISO).length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2"><Activity className="w-4 h-4 text-slate-300" /></div>
                      <span className="text-[10px]">خالی</span>
                    </motion.div>
                  )}
                  {tasks.filter(t => t.status === 'doing' && t.dueDate === selectedDateISO).map(task => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150/40 shadow-sm relative flex flex-col gap-2">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-normal">{task.title}</h4>
                      <p className="text-[10px] text-slate-400">{useJalaliCalendar ? getJalaliDate(task.dueDate) : task.dueDate}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50/50 mt-auto">
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'todo' as const } : t);
                            saveTasksToLocal(updated);
                          }}
                          className="text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                        >
                          ← برگشت
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'done' as const } : t);
                            saveTasksToLocal(updated);
                            earnXp(20, `تکمیل کار "${task.title}"`);
                          }}
                          className="text-[9px] font-black text-emerald-700 hover:underline bg-emerald-50 px-2.5 py-1 rounded text-emerald-700"
                        >
                          کامل شد ✓
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Done Column */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-150 mb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>کامل شده</span>
                  </span>
                  <span className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">{tasks.filter(t=>t.status === 'done' && t.dueDate === selectedDateISO).length}</span>
                </div>

                <AnimatePresence mode="popLayout">
                  {tasks.filter(t => t.status === 'done' && t.dueDate === selectedDateISO).length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2"><Check className="w-4 h-4 text-emerald-300" /></div>
                      <span className="text-[10px]">در انتظار تکمیل</span>
                    </motion.div>
                  )}
                  {tasks.filter(t => t.status === 'done' && t.dueDate === selectedDateISO).map(task => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={task.id} className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-150/40 shadow-sm relative opacity-60 space-y-2 transition-opacity hover:opacity-100 group">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-xs text-slate-750 line-through leading-normal decoration-emerald-500/50">{task.title}</h4>
                        <button 
                          onClick={() => saveTasksToLocal(tasks.filter(t=>t.id !== task.id))}
                          className="text-slate-350 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold inline-block">تکمیل شده</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'doing' as const } : t);
                            saveTasksToLocal(updated);
                            earnXp(-20, `تکمیل کار "${task.title}"`);
                          }}
                          className="text-[9px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          ← برگشت به در حال انجام
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Health & Wellness Trackers */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1 text-right">
                <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-bold">پیشخوان پایش سلامت سایبان (Kortex Wellness Hub)</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">خانه تندرستی و ردیابی ارگانیک خلاق</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">شاخص‌های زیستی، زنجیره‌های کایزن عادات، زمان‌بندی مکمل‌ها، توده بدنی، خواب و عاطفه روزانه خود را مانیتور کنید.</p>
              </div>

              {/* Sub-navigation inside Health Tab */}
              <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveHealthSubTab('habits_meds')}
                  className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeHealthSubTab === 'habits_meds'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                  }`}
                >
                  ❤️ عادات و مکمل‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHealthSubTab('water_sleep')}
                  className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeHealthSubTab === 'water_sleep'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                  }`}
                >
                  💧 پایش آب و خواب
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHealthSubTab('bmi')}
                  className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeHealthSubTab === 'bmi'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                  }`}
                >
                  ⚖️ توده بدنی BMI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHealthSubTab('mood')}
                  className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeHealthSubTab === 'mood'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                  }`}
                >
                  🎭 پایش خلق‌وخو
                </button>
              </div>
            </div>

            {/* Sub-Tab 1: Habits and Medicines */}
            {activeHealthSubTab === 'habits_meds' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Habits tracking */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-55">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <span>زنجیره عادات تکرارشونده روزانه (Streak Trackers)</span>
                    </h3>
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-bold">
                      {habits.filter(h => isHabitCompleted(h)).length} متعهد
                    </span>
                  </div>

                  {/* Habit Add form */}
                  <form onSubmit={addManualHabit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ثبت نام عادت کایزن جدید (مثلاً: ۳۰ دقیقه مطالعه)..."
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-455 focus:ring-1 focus:ring-rose-400"
                    />
                    <button
                      type="submit"
                      className="bg-rose-55 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      افزودن
                    </button>
                  </form>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    <AnimatePresence mode="popLayout">
                      {habits.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                          <Heart className="w-8 h-8 opacity-20 mx-auto mb-2" />
                          هیچ عادتی ثبت نشده است. ساخت کارما را شروع کنید!
                        </motion.div>
                      ) : (
                        habits.map((hbt) => (
                          <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={hbt.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-100 dark:border-slate-800 transition-all">
                            <div className="space-y-1">
                              <h4 className={`font-bold text-xs text-slate-800 dark:text-slate-200 ${isHabitCompleted(hbt) ? 'line-through text-slate-400' : ''}`}>
                                {hbt.name}
                              </h4>
                              <span className="text-[10px] text-pink-500 font-bold block">🔥 {hbt.streak} روز متوالی موفق</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                disabled={isSelectedDatePast || isSelectedDateFuture}
                                onClick={() => toggleHabit(hbt.id)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isHabitCompleted(hbt)
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                                }`}
                              >
                                {isHabitCompleted(hbt) ? 'کامل شد ✓' : 'تکمیل امروز'}
                              </button>
                              
                              <button
                                onClick={() => deleteHabit(hbt.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف عادت"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Medicines layout */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-55">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-indigo-500" />
                      <span>دستیار یادآوری مصرف داروها و مکمل ملایم</span>
                    </h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">
                      {medicines.filter(m => isMedicineCompleted(m)).length} مصرف‌شده
                    </span>
                  </div>

                  <form onSubmit={addManualMedicine} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="sm:col-span-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">ثبت یادآور مکمل جدید</div>
                    <input
                      type="text"
                      placeholder="نام مکمل (ویتامین ث)..."
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="text-xs border border-slate-250 bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
                    />
                    <input
                      type="text"
                      placeholder="دوز (یک عدد صبح)..."
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="text-xs border border-slate-250 bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
                    />
                    <input
                      type="time"
                      value={newMedTime}
                      onChange={(e) => setNewMedTime(e.target.value)}
                      className="text-xs border border-slate-250 bg-white dark:bg-slate-900 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="submit"
                      className="sm:col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      ثبت مکمل روزانه جدید
                    </button>
                  </form>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    <AnimatePresence mode="popLayout">
                      {medicines.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center flex flex-col justify-center items-center py-10 text-slate-400 text-[10px]">
                          <AlertCircle className="w-8 h-8 opacity-20 mx-auto mb-2" />
                          هیچ یادآور مکمل یا دارویی ثبت نشده است.
                        </motion.div>
                      ) : (
                        medicines.map((med) => (
                          <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={med.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-100 dark:border-slate-800 transition-all">
                            <div className="space-y-1">
                              <h4 className={`font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2 ${isMedicineCompleted(med) ? 'text-slate-400 line-through' : ''}`}>
                                <span>{med.name}</span>
                                <span className="text-[9px] text-indigo-650 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-indigo-100 font-mono font-bold">{med.time}</span>
                              </h4>
                              <p className="text-[10px] text-slate-400">{med.dosage}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                disabled={isSelectedDatePast || isSelectedDateFuture}
                                onClick={() => toggleMedicine(med.id)}
                                className={`px-3 py-1.5 text-xs rounded-xl font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isMedicineCompleted(med)
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 line-through'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {isMedicineCompleted(med) ? 'مصرف شد ✓' : 'تأیید مصرف'}
                              </button>

                              <button
                                onClick={() => deleteMedicine(med.id)}
                                className="p-1.5 text-slate-350 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف مکمل"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Water and Sleep Loggers */}
            {activeHealthSubTab === 'water_sleep' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Detailed Water Hydration */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <h4 className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
                      <span className="text-teal-500 text-lg">💧</span>
                      <span>هیدراتاسیون و هرم نوشیدن آب کورتکس</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                      هدف روزانه: ۲۵۰۰ میلی‌لیتر
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-teal-50/20 p-5 rounded-2xl border border-teal-100/50">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">مصرف شده امروز:</span>
                      <span className="text-2xl font-black text-slate-850 font-mono">{health.waterToday} / ۲۵۰۰</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">میلی‌لیتر (ML)</span>
                    </div>

                    {/* Progress Circle Visualizer */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <span className="font-extrabold text-xs text-teal-650">{Math.round((health.waterToday / 2500) * 100)}%</span>
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="176" strokeDashoffset={Math.max(0, 176 - (176 * Math.min(health.waterToday, 2500)) / 2500)} className="transition-all duration-500" />
                      </svg>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button 
                      disabled={isSelectedDatePast || isSelectedDateFuture}
                      onClick={() => {
                        saveHealthToLocal({ ...health, waterToday: health.waterToday + 250 });
                        earnXp(5, "نوشیدن لیوان آب");
                      }}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 text-slate-705 border border-slate-150 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🥤 لیوان معمولی (+۲۵۰ml)
                    </button>
                    <button 
                      disabled={isSelectedDatePast || isSelectedDateFuture}
                      onClick={() => {
                        saveHealthToLocal({ ...health, waterToday: health.waterToday + 500 });
                        earnXp(10, "نوشیدن ماگ بزرگ آب");
                      }}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 text-slate-705 border border-slate-150 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🍼 ماگ کورتکس (+۵۰۰ml)
                    </button>
                    <button 
                      disabled={isSelectedDatePast || isSelectedDateFuture}
                      onClick={() => {
                        if (health.waterToday > 0) {
                          saveHealthToLocal({ ...health, waterToday: Math.max(0, health.waterToday - 250) });
                          earnXp(-5, "کاهش آب مصرفی");
                        }
                      }}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 text-slate-500 dark:text-slate-400 hover:text-rose-600 border border-slate-150 rounded-xl text-[10px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ↩️ کاهش آب (-۲۵۰ml)
                    </button>
                  </div>
                </div>

                {/* Sleep Quality Logger */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <h4 className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
                      <span className="text-indigo-500 text-lg">🌙</span>
                      <span>سنجش خواب عمیق و ریکاوری غدد مغزی</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      توصیه کورتکس: ۷.۵ ساعت
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">ساعات استراحت شب گذشته:</span>
                      <span className="font-bold text-indigo-600 font-mono text-sm">{health.sleepHours} ساعت</span>
                    </div>
                    
                    <input 
                      type="range"
                      min="4"
                      max="12"
                      step="0.5"
                      disabled={isSelectedDatePast || isSelectedDateFuture}
                      value={health.sleepHours}
                      onChange={(e) => saveHealthToLocal({ ...health, sleepHours: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    />

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">کیفیت عمومی خواب دیشب:</label>
                        <select
                          disabled={isSelectedDatePast || isSelectedDateFuture}
                          value={health.sleepQuality}
                          onChange={(e) => saveHealthToLocal({ ...health, sleepQuality: e.target.value as any })}
                          className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 font-medium text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="excellent">🏆 بسیار مقتدرانه و عمیق</option>
                          <option value="good">🟢 خوب و با نشاط زیاد</option>
                          <option value="fair">🟡 خستگی نسبی و خواب سطحی</option>
                          <option value="poor">🔴 نامنظم و خواب‌پریشی مکرر</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-center items-center bg-indigo-50/40 p-3 rounded-2xl text-center border border-indigo-100/50">
                        <span className="text-[9px] text-slate-450 block font-bold mb-1">بازسازی بیولوژیک سلولی:</span>
                        <span className="font-bold text-xs text-indigo-700">
                          {health.sleepQuality === 'excellent' ? '۱۰۰٪ (رویایی)' :
                           health.sleepQuality === 'good' ? '۸۵٪ (بسیار عالی)' :
                           health.sleepQuality === 'fair' ? '۶۰٪ (متوسط)' : '۳۵٪ (برنامه سم‌زدایی)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: BMI scale analyzer */}
            {activeHealthSubTab === 'bmi' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="text-xl">⚖️</span>
                    <span>ماشین حساب و آنالیز شاخص توده بدنی (BMI Cortex)</span>
                  </h3>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded font-bold">بادی کایزن</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-xs text-slate-505 leading-relaxed">با درج مرتب وزن و قد، تداوم کالیبراسیون ترکیب بدنی خود را ارزیابی و در پیشخوان تماشا کنید.</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Height tracker */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">مبنای قد کاربری (سانتی‌متر):</label>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="number" 
                            min="100" 
                            max="250"
                            value={userHeight}
                            onChange={(e) => saveUserHeight(Number(e.target.value))}
                            className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-400 w-full font-mono"
                          />
                          <span className="text-xs text-slate-400">cm</span>
                        </div>
                      </div>

                      {/* Weight tracker */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">سنجش وزن امروز (کیلوگرم):</label>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="number" 
                            min="30" 
                            max="250"
                            step="0.1"
                            value={userWeight}
                            onChange={(e) => saveUserWeight(Number(e.target.value))}
                            className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-400 w-full font-mono"
                          />
                          <span className="text-xs text-slate-400">kg</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => saveUserWeight(Number((userWeight - 0.5).toFixed(1)))}
                        className="text-xs font-bold px-3 py-2 bg-slate-150/60 hover:bg-slate-200 dark:bg-slate-700 rounded-xl transition-all cursor-pointer"
                      >
                        -۰.۵ کیلوگرم
                      </button>
                      <button 
                        onClick={() => saveUserWeight(Number((userWeight + 0.5).toFixed(1)))}
                        className="text-xs font-bold px-3 py-2 bg-slate-150/60 hover:bg-slate-200 dark:bg-slate-700 rounded-xl transition-all cursor-pointer"
                      >
                        +۰.۵ کیلوگرم
                      </button>
                    </div>
                  </div>

                  {/* BMI Calculation results view */}
                  {(() => {
                    const heightInMeters = userHeight / 100;
                    const bmi = Number((userWeight / (heightInMeters * heightInMeters)).toFixed(1)) || 0;
                    let bmiState = 'نرمال';
                    let bmiColor = 'text-emerald-600';
                    let bmiBg = 'bg-emerald-50 border-emerald-100/60';
                    let scaleOffset = '45%'; // representation offset

                    if (bmi < 18.5) {
                      bmiState = 'کمبود وزن بدنی (نیاز به پی ریزی رژیم صحیح)';
                      bmiColor = 'text-amber-600';
                      bmiBg = 'bg-amber-50 border-amber-100/60';
                      scaleOffset = '22%';
                    } else if (bmi >= 18.5 && bmi < 25) {
                      bmiState = 'تناسب وزن فوق‌العاده نرمال و سبک زندگی سالم';
                      bmiColor = 'text-emerald-600';
                      bmiBg = 'bg-emerald-50 border-emerald-100/60';
                      scaleOffset = '45%';
                    } else if (bmi >= 25 && bmi < 30) {
                      bmiState = 'اضافه‌وزن جزئی (نیازمند کالری سوزی و ورزش روزانه)';
                      bmiColor = 'text-orange-600';
                      bmiBg = 'bg-orange-50 border-orange-100/60';
                      scaleOffset = '68%';
                    } else {
                      bmiState = 'اضافه‌وزن شدید و تراکم نامطلوب ساختار چربی';
                      bmiColor = 'text-rose-600';
                      bmiBg = 'bg-rose-50 border-rose-100/60';
                      scaleOffset = '88%';
                    }

                    return (
                      <div className={`p-6 rounded-2xl border ${bmiBg} text-right space-y-4`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">شاخص بیولوژیکی (BMI Gauge):</span>
                          <span className={`text-2xl font-black font-mono leading-none ${bmiColor}`}>{bmi}</span>
                        </div>

                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                          مقطع کورتکس شما: <span className={bmiColor}>{bmiState}</span>
                        </div>

                        {/* Visual Range bar gauge */}
                        <div className="bg-slate-200 dark:bg-slate-700/80 h-2.5 rounded-full relative overflow-visible mt-6">
                          <div className="absolute top-[-4px] w-4.5 h-4.5 rounded-full bg-slate-900 border-2 border-white shadow transition-all duration-300" style={{ right: scaleOffset }} />
                          <div className="absolute top-4 text-[8px] text-slate-400 right-[22%] translate-x-[50%] font-bold">لاغر (کمتر از ۱۸.۵)</div>
                          <div className="absolute top-4 text-[8px] text-slate-400 right-[45%] translate-x-[50%] font-bold font-black">ایده‌آل (۱۸.۵-۲۵)</div>
                          <div className="absolute top-4 text-[8px] text-slate-400 right-[68%] translate-x-[50%] font-bold">اضافه‌وزن (۲۵-۳۰)</div>
                          <div className="absolute top-4 text-[8px] text-slate-405 right-[88%] translate-x-[50%] font-bold">چاق (بیشتر از ۳۰)</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Mood and emotions tracker */}
            {activeHealthSubTab === 'mood' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mood Logger interaction */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="text-lg">🎭</span>
                      <span>پایش روزانه جزر و مد احساسی و خلقی (Emotional Track)</span>
                    </h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-bold">روانشناسی کایزن</span>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-right leading-relaxed">احساس قلبی و سطح انگیزه امروزتان را لمس کنید تا در نمودار کورتکس به عنوان الگو ثبت شود:</p>
                    
                    <div className="flex justify-around items-center py-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-2xl">
                      {([
                        { score: 5, label: 'بمب انگیزه', emoji: '🚀' },
                        { score: 4, label: 'شاداب', emoji: '😊' },
                        { score: 3, label: 'معمولی', emoji: '😐' },
                        { score: 2, label: 'خسته/بی‌ذوق', emoji: '😞' },
                        { score: 1, label: 'عصبی/بحرانی', emoji: '😠' }
                      ] as const).map(item => (
                        <button
                          type="button"
                          key={item.score}
                          onClick={() => {
                            saveHealthToLocal({ ...health, moodScore: item.score });
                            saveMoodLog(selectedDateISO, item.score);
                            earnXp(10, `ثبت وضعیت روحی "${item.label}"`);
                            showToast(`حال روحی شما روی "${item.label}" ثبت شد`, "success");
                          }}
                          className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
                            health.moodScore === item.score 
                              ? 'bg-rose-50 text-rose-650 border border-rose-200 scale-105 font-bold' 
                              : 'hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span className="text-2xl mb-1">{item.emoji}</span>
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* History list and spark histogram */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>📉</span>
                      <span>سوابق نوسان احساسی کورتکس مغز</span>
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {moodLogs.slice().reverse().map((log, i) => {
                      const dateText = useJalaliCalendar ? getJalaliDate(log.date) : log.date;
                      let moodEmoji = '😐';
                      let moodStyle = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
                      if (log.mood === 5) { moodEmoji = '🚀 بمب کار و انگیزه'; moodStyle = 'text-pink-600 bg-pink-50 font-bold'; }
                      else if (log.mood === 4) { moodEmoji = '😊 خندان و پر انرژی'; moodStyle = 'text-emerald-705 bg-emerald-50 font-bold'; }
                      else if (log.mood === 3) { moodEmoji = '😐 معمولی آرام'; moodStyle = 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950'; }
                      else if (log.mood === 2) { moodEmoji = '😞 کمی خسته'; moodStyle = 'text-amber-600 bg-amber-50'; }
                      else if (log.mood === 1) { moodEmoji = '😠 دغدغه‌مند/بحرانی'; moodStyle = 'text-rose-600 bg-rose-50'; }

                      return (
                        <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">{dateText}</span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg ${moodStyle}`}>{moodEmoji}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: General Configuration Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">تنظیمات و صیانت از داده‌های سایبان</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">شخصی‌سازی نمای تقویم، صادر کردن بکاپ‌های کورتکس و حریم داده‌های شخصی شما.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Settings Placeholder */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-50 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-600" />
                  <span>تنظیمات حساب کاربری</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تنظیمات امنیتی و پروفایل حساب کاربری شما در اینجا قرار می‌گیرد.
                </p>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    این بخش در حال توسعه است...
                  </span>
                </div>
              </div>

              {/* Visual Preferences */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-50">پیکربندی هویت ظاهری</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">اندازه پیش‌فرض قلم متون</span>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                      {['small', 'medium', 'large'].map(sz => (
                        <button 
                          key={sz}
                          onClick={() => setFontSize(sz as any)}
                          className={`px-2.5 py-1 rounded cursor-pointer ${fontSize === sz ? 'bg-white dark:bg-slate-900 text-teal-800 font-bold shadow-sm' : 'text-slate-450'}`}
                        >
                          {sz === 'small' ? 'کوچک' : sz === 'large' ? 'بزرگ' : 'متوسط'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className="text-slate-600 dark:text-slate-400">نوع سال‌نامه پیش‌فرض</span>
                    <button 
                      onClick={() => setUseJalaliCalendar(!useJalaliCalendar)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded-lg font-bold"
                    >
                      {useJalaliCalendar ? 'جلالی (شمسی)' : 'میلادی (Gregorian)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Import and Export privacy */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-50">حریم خصوصی داده‌ها و خروجی‌ها</h3>
                <p className="text-xs text-slate-450 leading-relaxed">کل بدنه داده‌های شما اعم از خواب، وزن، رویدادها و یادداشت‌ها منحصرا در این کپی از سند مرورگر شما نگهداری شده و هر زمان اراده کنید، برای همیشه پاک‌سازی می‌شود.</p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button 
                    onClick={exportBackupJSON}
                    className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4" />
                    <span>خروجی گرفتن فایل JSON</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (confirm("آیا مایلید کل مخزن داده محلی را پاک‌سازی کنید؟ این عمل بازگشت ناپذیر است.")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 cursor-pointer"
                  >
                    پاک‌سازی کل اطلاعات کورتکس
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Support, Tickets, and Suggestions */}
        {activeTab === 'support' && (
          <SupportTabView 
            useJalaliCalendar={useJalaliCalendar} 
            onTicketsUpdate={(hasUnread) => setHasUnreadTickets(hasUnread)}
          />
        )}

        {/* Tab 8: Monthly Calendar Board */}
        {activeTab === 'calendar' && (
          <MonthlyCalendarView
            events={events}
            tasks={tasks}
            saveEventsToLocal={saveEventsToLocal}
            saveTasksToLocal={saveTasksToLocal}
            useJalaliCalendar={useJalaliCalendar}
            todayISO={todayISO}
            showToast={showToast}
          />
        )}

        {/* Tab 9: Brain Gym (باشگاه مغز) */}
        {activeTab === 'brain_gym' && (
          <BrainGymView
            useJalaliCalendar={useJalaliCalendar}
            earnXp={earnXp}
            showToast={showToast}
            playAudioFeedback={playAudioFeedback}
          />
        )}
      </main>
    </div>

      {/* Floating NLP Chat Input modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-150 shadow-2xl space-y-4 relative"
              dir="rtl"
            >
              <button 
                onClick={() => { setShowQuickAdd(false); setQuickAddResult(null); setQuickAddText(""); }}
                className="absolute top-4 right-4 text-slate-450 hover:text-slate-800 dark:text-slate-200 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>

              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span>درج فوری کار / رویداد از طریق کورتکس (NLP AI)</span>
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                جمله طبیعی خود را اعم از فارسی یا انگلیسی درج کنید تا دستیار شما در لحظه تصمیم گرفته و اسلات تقویم، یادداشت یا بورد کایزن شما را ارتقا ببخشاید.
              </p>

              <form onSubmit={handleQuickAdd} className="space-y-3">
                <input 
                  type="text"
                  required
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  placeholder="مثال: کار خرید کادوی تولد با اولویت بالا تا فردا اضافه کن"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans text-xs"
                />

                <div className="flex gap-2 justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      setQuickAddText("فردا ساعت ۱۸:۰۰ یاد آوری خرید مکمل اضافه کن");
                    }}
                    className="px-3.5 py-1.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
                  >
                    سفر میانبر دمو
                  </button>

                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow shadow-teal-500/10 cursor-pointer"
                  >
                    پردازش عصبی گوگل
                  </button>
                </div>
              </form>

              {quickAddResult && (
                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-150/50 text-xs font-semibold text-teal-900 leading-loose">
                  {quickAddResult}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
              dir="rtl"
            >
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">تأیید خروج</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-loose">
                آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
              </p>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  className="px-5 py-2.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow shadow-rose-500/20 transition-all cursor-pointer"
                >
                  خروج
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Global Command Palette Modal (Ctrl+K / Cmd+K) */}
      <AnimatePresence>
        {isCmdPaletteOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4"
            onClick={() => setIsCmdPaletteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: -10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden text-right block"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  autoFocus
                  placeholder="جستجو در قابلیت‌ها و دستورات سریع کلاسیک سایبان (کلید Esc برای خروج)..."
                  value={cmdSearchQuery}
                  onChange={e => setCmdSearchQuery(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-none placeholder-slate-400"
                />
                <span className="text-[10px] bg-slate-150 text-slate-500 dark:text-slate-400 py-1 px-2.5 rounded-lg font-mono">ESC</span>
              </div>

              {/* Action list */}
              <div className="p-2 max-h-80 overflow-y-auto space-y-1">
                {/* eslint-disable-next-line react-hooks/refs */}
                {[
                  { name: "🧘 شروع زنگ تمرکز ذهن و بلوک کایزن (Zen Mode)", desc: "ورود مستقیم به تمرکز بدون حواس‌پرتی و دریافت XP", action: () => { setIsZenMode(true); setIsZenAudioPlaying(true); setIsZenTimerRunning(true); setIsCmdPaletteOpen(false); } },
                  { name: "📅 تغییر بین تقویم خورشیدی و میلادی", desc: "نمایش تمام رویدادها با ساختار دلخواه شما", action: () => { setUseJalaliCalendar(!useJalaliCalendar); showToast("تقویم بروزرسانی شد", "info"); setIsCmdPaletteOpen(false); } },
                  { name: "⚡ باز کردن ماژول یادداشت جدید بی‌نام", desc: "شروع تایپ یک ایده بکر یا پیش‌نویس سریع", action: () => { createBlankNote(); setActiveTab("notes"); setIsCmdPaletteOpen(false); } },
                  { name: "🕸️ نمایش شبکه روابط یادداشتی (Obsidian Mode)", desc: "نگاشت تصویری اتصالات یادداشت‌های کورتکس", action: () => { setShowNotesGraph(true); setActiveTab("notes"); setIsCmdPaletteOpen(false); } },
                  { name: "🎯 ایجاد یک کار دارای اولویت بالا امروز", desc: "پرش مستقیم به افزودن برنامه‌ها در بورد", action: () => { setActiveTab("tasks"); setIsCmdPaletteOpen(false); } },
                  { name: "📊 رصد فاکتورهای سلامت (آب و خواب)", desc: "بررسی الگوهای روانی و بیولوژیکی شخصی", action: () => { setActiveTab("health"); setIsCmdPaletteOpen(false); } },
                  { name: "🤖 دستیار هوشمند مشاور شخصی سایبان", desc: "پرسش و پاسخ با هوش مصنوعی کورتکس ۳.۵ گوگل", action: () => { setActiveTab("overview"); setIsCmdPaletteOpen(false); } }
                ]
                .filter(item => item.name.includes(cmdSearchQuery) || item.desc.includes(cmdSearchQuery))
                .map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      cmd.action();
                      playAudioFeedback('done');
                    }}
                    className="w-full text-right p-3 hover:bg-teal-50/50 rounded-2xl transition-colors cursor-pointer block group text-slate-700 dark:text-slate-300 hover:text-teal-900"
                  >
                    <div className="font-extrabold text-xs flex items-center justify-between">
                      <span>{cmd.name}</span>
                      <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-black">اجرا ←</span>
                    </div>
                    <p className="text-[10px] text-slate-450 font-semibold mt-1">{cmd.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Zen Focus Mode / Pomodoro Immersive Fullscreen Overlay */}
      <AnimatePresence>
        {isZenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-8 font-sans bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
          >
            {/* Zen Header */}
            <div className="flex flex-col xl:flex-row gap-4 items-center justify-between text-right border-b border-white/5 pb-4" dir="rtl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsZenMode(false);
                    setIsZenTimerRunning(false);
                    playAudioFeedback('click');
                  }}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 rounded-xl transition-all cursor-pointer flex items-center gap-2 font-black text-xs shadow-md shadow-rose-500/5 hover:scale-[1.02]"
                  title="خروج از حالت تمرکز مطلق"
                >
                  <LogOut className="w-4 h-4 transform rotate-180" />
                  <span>خروج از تمرکز</span>
                </button>
                <div>
                  <span className="text-[10px] font-black text-teal-400 tracking-wider block uppercase">کورتکس تفکر بدون مرز</span>
                  <h2 className="text-sm font-extrabold">محیط تمرکز مطلق (Zen & Pomodoro)</h2>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-400">
                با موسیقی پویا و بدون مصرف توکن‌های هوش مصنوعی، تمرکز کایزن خود را کالیبره کنید.
              </div>
            </div>

            {/* Huge Counter Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <span className="text-[10px] font-extrabold tracking-widest text-white/40 uppercase">
                {zenTimerType === 'focus' ? '🎯 زمان تمرکز کایزن فعال است' : '🌸 زمان برای بازیابی و استراحت'}
              </span>

              {/* Big SVG Pulse ring inside counter */}
              <div className="relative w-72 h-72 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: isZenTimerRunning ? [1, 1.05, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-4 border-teal-500/25 border-dashed" 
                />
                <div className="text-6xl font-black font-mono tracking-tight text-teal-350 select-none drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                  {Math.floor(zenTimeRemaining / 60).toString().padStart(2, '0')}
                  <span className="animate-[pulse_1.5s_infinite]">:</span>
                  {(zenTimeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Dynamic Duration Customizer Trigger & Form */}
              {!isZenTimerRunning && (
                <div className="flex flex-col items-center gap-2 pt-1 animate-fadeIn" dir="rtl">
                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback('click');
                      setShowTimeSettings(!showTimeSettings);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-teal-400" />
                    <span>تنظیم زمان تمرکز ({zenFocusDuration} دقیقه)</span>
                  </button>

                  {showTimeSettings && (
                    <div className="flex flex-col items-center gap-3 bg-slate-900 border border-white/10 p-4 rounded-2xl max-w-xs mt-1 animate-fadeIn shadow-xl">
                      <span className="text-[10px] text-slate-400 font-bold">زمان تمرکز را انتخاب یا وارد کنید:</span>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {[10, 15, 25, 30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => {
                              setZenFocusDuration(mins);
                              setZenTimeRemaining(mins * 60);
                              playAudioFeedback('click');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer ${
                              zenFocusDuration === mins 
                                ? 'bg-teal-500 text-slate-950 border-teal-400 font-black' 
                                : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                            }`}
                          >
                            {mins} د
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/5 w-full justify-center">
                        <span className="text-[10px] text-slate-400">سفارشی:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="180" 
                          value={zenFocusDuration}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 25);
                            setZenFocusDuration(val);
                            setZenTimeRemaining(val * 60);
                          }}
                          className="w-16 px-2.5 py-1 bg-slate-950 border border-white/10 rounded-xl text-center text-xs font-black focus:outline-none focus:border-teal-400 text-teal-300 font-mono"
                          title="زمان سفارشی به دقیقه"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            playAudioFeedback('click');
                            setShowTimeSettings(false);
                          }}
                          className="px-3 py-1 bg-teal-50 text-slate-950 rounded-lg text-[10px] font-black cursor-pointer hover:bg-teal-400 transition-colors"
                        >
                          تایید و بستن
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Music Player Dynamic Controller Bar */}
              <div className="max-w-md w-full mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3" dir="rtl">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                      <Music className={`w-4 h-4 ${isZenAudioPlaying ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-bold">موسیقی در حال پخش:</span>
                      <span className="text-xs font-extrabold text-white">
                        {(() => {
                          const activeCat = zenCategories.find(c => c.id === zenActiveCatId);
                          const activeTrack = activeCat?.tracks?.[zenActiveTrackIndex];
                          return activeTrack ? activeTrack.name : 'انتخاب نشده / خالی';
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Loop Selector */}
                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback('click');
                      setZenAudioLoop(prev => prev === 'none' ? 'one' : prev === 'one' ? 'all' : 'none');
                    }}
                    className={`text-[9px] font-black px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      zenAudioLoop === 'one' ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' :
                      zenAudioLoop === 'all' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      'bg-white/5 text-slate-400 border-white/10'
                    }`}
                    title={zenAudioLoop === 'one' ? 'تکرار همین آهنگ' : zenAudioLoop === 'all' ? 'تکرار کل لیست' : 'بدون تکرار'}
                  >
                    {zenAudioLoop === 'one' ? '🔂 تکرار تک' : zenAudioLoop === 'all' ? '🔁 تکرار لیست' : '➡️ بدون تکرار'}
                  </button>
                </div>

                {/* Music Playback Action Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback('click');
                      playPrevZenTrack();
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="آهنگ قبلی"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback('click');
                      setIsZenAudioPlaying(!isZenAudioPlaying);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isZenAudioPlaying ? 'bg-teal-500/20 text-teal-300 border-teal-500/30 animate-pulse' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isZenAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 pl-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playAudioFeedback('click');
                      playNextZenTrack();
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="آهنگ بعدی"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                </div>

                {/* Dynamic Category Tabs Selector inside Player */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-white/5 w-full">
                  {zenCategories.length === 0 ? (
                    <span className="text-[10px] text-slate-500">هیچ بخشی در پنل ادمین ثبت نشده است</span>
                  ) : (
                    zenCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          playAudioFeedback('click');
                          setZenActiveCatId(cat.id);
                          setZenActiveTrackIndex(0);
                          if (isZenAudioPlaying) {
                            startZenAmbientAudio(cat.id, 0);
                          }
                        }}
                        className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          zenActiveCatId === cat.id ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Focus Task Selection */}
              <div className="space-y-2 max-w-sm w-full" dir="rtl">
                <label className="text-[10px] block font-black text-slate-400">پیوند تمرکز به تسک کایزن:</label>
                <select 
                  value={zenSelectedTaskId || ""}
                  onChange={e => {
                    setZenSelectedTaskId(e.target.value || null);
                    playAudioFeedback('click');
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white max-w-xs focus:outline-none focus:ring-1 focus:ring-teal-400 mx-auto cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white font-medium">-- بدون پیوند به کار معین --</option>
                  {tasks.filter(t => t.status !== 'done').map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white font-semibold">{t.title}</option>
                  ))}
                </select>
              </div>

              {/* Interaction buttons */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    setIsZenTimerRunning(!isZenTimerRunning);
                    playAudioFeedback('click');
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${isZenTimerRunning ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20' : 'bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20'}`}
                >
                  {isZenTimerRunning ? <Pause className="w-6 h-6 text-slate-950" /> : <Play className="w-6 h-6 text-slate-950 pl-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setZenTimeRemaining(zenFocusDuration * 60);
                    setIsZenTimerRunning(false);
                    playAudioFeedback('click');
                    showToast(`تایمر به ${zenFocusDuration} دقیقه بازنشانی شد`, "info");
                  }}
                  title={`بازنشانی مجدد به ${zenFocusDuration} دقیقه`}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Zen Footer */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-slate-450" dir="rtl">
              <span>گام‌های تفکر عمیق کورتکس سایبان • برای خروج دکمه Esc یا خروج کایزن را بزنید</span>
              <button
                onClick={() => {
                  setIsZenMode(false);
                  setIsZenTimerRunning(false);
                  playAudioFeedback('click');
                }}
                className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl font-bold transition-all cursor-pointer"
              >
                خروج از زن تمرکز
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-xs font-bold font-sans text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-slate-150/80"
            dir="rtl"
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-teal-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="mr-2 text-slate-450 hover:text-slate-800 dark:text-slate-200 text-[10px] cursor-pointer" type="button">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
