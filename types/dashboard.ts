// types/dashboard.ts

export type DashboardTab =
  | 'overview'
  | 'planner'
  | 'notes'
  | 'tasks'
  | 'health'
  | 'settings'
  | 'support'
  | 'calendar'
  | 'brain_gym'
  | 'assistant';

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

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  subtasks?: Subtask[];
}

export interface HealthMetrics {
  waterToday: number; // تعداد لیوان یا ml
  sleepHours: number;
  sleepQuality: 'excellent' | 'good' | 'fair' | 'poor';
  moodScore: number; // 1-5
  weight: number; // کیلوگرم
  workoutType: string;
  workoutMin: number;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDates?: string[];
  completedToday?: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  completedDates?: string[];
  completedToday?: boolean;
}

export interface MoodLog {
  date: string;
  mood: number;
}

export interface ZenTrack {
  id: string;
  name: string;
  url: string;
}

export interface ZenCategory {
  id: string;
  name: string;
  tracks: ZenTrack[];
}

export type ZenAudioLoop = 'none' | 'one' | 'all';

export interface Announcement {
  show: boolean;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | string;
}

export interface ToastNotification {
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface DashboardProps {
  userName: string;
  onLogout: () => void;
}