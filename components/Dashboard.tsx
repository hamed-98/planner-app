// components/Dashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  CalendarEvent,
  Note,
  Task,
  HealthMetrics,
  Habit,
  Medicine,
  DashboardTab,
  DashboardProps,
  Announcement,
  ToastNotification,
} from '@/types/dashboard';
import { useGamification } from '@/hooks/dashboard/useGamification';
import { useDashboardData } from '@/hooks/dashboard/useDashboardData';

// ویجت‌های معلق و اشتراکی
import DashboardSidebar from './dashboard/shared/DashboardSidebar';
import MobileHeader from './dashboard/shared/MobileHeader';
import TimelineDateBar from './dashboard/shared/TimelineDateBar';
import AnnouncementBanner from './dashboard/shared/AnnouncementBanner';
import ZenFocusOverlay from './dashboard/shared/ZenFocusOverlay';
import QuickActionModal from './dashboard/shared/QuickActionModal';
import CommandPaletteModal from './dashboard/shared/CommandPaletteModal';
import LogoutConfirmModal from './dashboard/shared/LogoutConfirmModal';
import ToastNotificationBar from './dashboard/shared/ToastNotificationBar';

// نماهای تب‌های استاندارد
import OverviewView from './dashboard/views/OverviewView';
import TasksView from './dashboard/views/TasksView';
import PlannerView from './dashboard/views/PlannerView';
import NotesView from './dashboard/views/NotesView';
import HealthView from './dashboard/views/HealthView';
import SettingsView from './dashboard/views/SettingsView';

// بارگذاری تنبل ماژول‌های حجیم (Dynamic Imports)
const MonthlyCalendarView = dynamic(() => import('./MonthlyCalendarView'), {
  loading: () => <div className="p-8 text-center text-xs text-slate-400 font-bold">در حال بارگذاری تقویم...</div>,
});
const BrainGymView = dynamic(() => import('./BrainGymView'), {
  loading: () => <div className="p-8 text-center text-xs text-slate-400 font-bold">در حال بارگذاری باشگاه مغز...</div>,
});
const SupportTabView = dynamic(() => import('./SupportTabView'), {
  loading: () => <div className="p-8 text-center text-xs text-slate-400 font-bold">در حال بارگذاری پشتیبانی...</div>,
});
const AssistantView = dynamic(() => import('./AssistantView'), {
  loading: () => <div className="p-8 text-center text-xs text-slate-400 font-bold">در حال بارگذاری دستیار هوشمند...</div>,
});

// حفظ Re-exportها جهت جلوگیری از شکست ایمپورت در سایر فایل‌ها
export type {
  CalendarEvent,
  Note,
  Task,
  HealthMetrics,
  Habit,
  Medicine,
  DashboardTab,
  DashboardProps,
};

export default function Dashboard({ userName, onLogout }: DashboardProps) {
  // ۱. مدیریت Toast سراسری
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ۲. هوک‌های منطق، گیمیفیکیشن و دیتای متمرکز
  const gamification = useGamification({ showToast });
  const data = useDashboardData({
    userName,
    earnXp: gamification.earnXp,
    showToast,
  });

  // ۳. استیت‌های ناوبری و رابط کاربری
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('sayeban_active_tab');
      if (saved) return saved as DashboardTab;
    }
    return 'overview';
  });

  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sayeban_active_tab', tab);
    }
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  // استیت‌های مدال‌ها و اورلی‌ها
  const [isZenMode, setIsZenMode] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => data.notes[0]?.id || null);

  // دریافت اعلان‌های سراسری
  useEffect(() => {
    fetch('/api/settings?id=announcements', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((annData) => {
        if (annData?.show) setAnnouncement(annData);
      })
      .catch(() => {});
  }, []);

  // شنونده کلیدهای میانبر (Ctrl+Q, Ctrl+K, Escape)
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'q' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowQuickAdd((prev) => !prev);
        gamification.playAudioFeedback('click');
      }
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsCmdPaletteOpen((prev) => !prev);
        gamification.playAudioFeedback('click');
      }
      if (e.key === 'Escape') {
        setIsCmdPaletteOpen(false);
        setShowQuickAdd(false);
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [gamification]);

  // صادر کردن فایل پشتیبان JSON
  const exportBackupJSON = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify({
          events: data.events,
          notes: data.notes,
          tasks: data.tasks,
          health: data.health,
          habits: data.habits,
          medicines: data.medicines,
          profile: { userName },
        })
      );
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `sayeban_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }, [data.events, data.notes, data.tasks, data.health, data.habits, data.medicines, userName]);

  const fontStyleClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';

  return (
    <div className={`min-h-screen md:h-screen ${fontStyleClass} flex flex-col md:overflow-hidden bg-[#FAFCFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors`}>
      {/* هدر موبایل */}
      <MobileHeader
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        {/* سایدبار ناوبری و اطلاعات حساب */}
        <DashboardSidebar
          userName={userName}
          activeTab={activeTab}
          onTabChange={(t) => {
            handleTabChange(t);
            setIsMobileMenuOpen(false);
          }}
          eventsCount={data.events.length}
          pendingTasksCount={data.tasks.filter((t) => t.status !== 'done').length}
          hasUnreadTickets={data.hasUnreadTickets}
          level={gamification.levelData.level}
          title={gamification.levelData.title}
          xp={gamification.xp}
          progressPercent={gamification.levelData.progressPercent}
          xpRemaining={gamification.levelData.xpRemaining}
          isMobileOpen={isMobileMenuOpen}
          onOpenZen={() => setIsZenMode(true)}
          onOpenQuickAdd={() => setShowQuickAdd(true)}
          onOpenLogout={() => setShowLogoutConfirm(true)}
        />

        {/* بدنه اصلی داشبورد */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-[#FAFCFC] dark:bg-[#0B1120] md:rounded-tl-3xl border-t border-r border-transparent dark:border-slate-800/50">
          <AnnouncementBanner announcement={announcement} onClose={() => setAnnouncement(null)} />

          <TimelineDateBar
            selectedDateISO={data.selectedDateISO}
            todayISO={data.todayISO}
            useJalaliCalendar={data.useJalaliCalendar}
            tasks={data.tasks}
            events={data.events}
            isSelectedDatePast={data.isSelectedDatePast}
            isSelectedDateFuture={data.isSelectedDateFuture}
            onSelectDate={data.setSelectedDateISO}
            onModifyDays={data.modifySelectedDate}
          />

          {/* ۱. پیشخوان */}
          {activeTab === 'overview' && (
            <OverviewView
              userName={userName}
              selectedDateISO={data.selectedDateISO}
              todayISO={data.todayISO}
              useJalaliCalendar={data.useJalaliCalendar}
              health={data.health}
              tasks={data.tasks}
              events={data.events}
              habits={data.habits}
              medicines={data.medicines}
              brainMetrics={data.brainMetrics}
              brainProfile={data.brainProfile}
              userWeight={data.userWeight}
              userHeight={data.userHeight}
              isHealthDataLoaded={data.isHealthDataLoaded}
              isSelectedDatePast={data.isSelectedDatePast}
              isSelectedDateFuture={data.isSelectedDateFuture}
              isHabitCompleted={data.isHabitCompleted}
              isMedicineCompleted={data.isMedicineCompleted}
              onNavigateTab={handleTabChange}
              onOpenZen={() => setIsZenMode(true)}
              onAddWater={data.handleAddWater}
              onSaveHealth={data.saveHealthToLocal}
              onSelectMood={data.handleSelectMood}
              onSaveUserWeight={data.saveUserWeight}
              onSaveTasks={data.saveTasksToLocal}
              earnXp={gamification.earnXp}
            />
          )}

          {/* ۲. تقویم و پلنر */}
          {activeTab === 'planner' && (
            <PlannerView
              events={data.events}
              selectedDateISO={data.selectedDateISO}
              todayISO={data.todayISO}
              useJalaliCalendar={data.useJalaliCalendar}
              onToggleCalendarType={data.toggleCalendarType}
              onSaveEvents={data.saveEventsToLocal}
              showToast={showToast}
            />
          )}

          {/* ۳. نمای ماهانه تقویم */}
          {activeTab === 'calendar' && (
            <MonthlyCalendarView
              events={data.events}
              tasks={data.tasks}
              saveEventsToLocal={data.saveEventsToLocal}
              saveTasksToLocal={data.saveTasksToLocal}
              useJalaliCalendar={data.useJalaliCalendar}
              todayISO={data.todayISO}
              showToast={showToast}
            />
          )}

          {/* ۴. یادداشت‌ها */}
          {activeTab === 'notes' && (
            <NotesView
              notes={data.notes}
              activeNoteId={activeNoteId}
              setActiveNoteId={setActiveNoteId}
              onSaveNotes={data.saveNotesToLocal}
              playAudioFeedback={gamification.playAudioFeedback}
              showToast={showToast}
            />
          )}

          {/* ۵. بورد وظایف و کانبان */}
          {activeTab === 'tasks' && (
            <TasksView
              tasks={data.tasks}
              selectedDateISO={data.selectedDateISO}
              useJalaliCalendar={data.useJalaliCalendar}
              isSelectedDatePast={data.isSelectedDatePast}
              isSelectedDateFuture={data.isSelectedDateFuture}
              onSaveTasks={data.saveTasksToLocal}
              earnXp={gamification.earnXp}
              showToast={showToast}
            />
          )}

          {/* ۶. تندرستی و ردیابی ارگانیک */}
          {activeTab === 'health' && (
            <HealthView
              health={data.health}
              habits={data.habits}
              medicines={data.medicines}
              moodLogs={data.moodLogs}
              userHeight={data.userHeight}
              userWeight={data.userWeight}
              selectedDateISO={data.selectedDateISO}
              useJalaliCalendar={data.useJalaliCalendar}
              isSelectedDatePast={data.isSelectedDatePast}
              isSelectedDateFuture={data.isSelectedDateFuture}
              onSaveHealth={data.saveHealthToLocal}
              onSaveHabits={data.saveHabitsToLocal}
              onSaveMedicines={data.saveMedicinesToLocal}
              onSaveUserHeight={data.saveUserHeight}
              onSaveUserWeight={data.saveUserWeight}
              onAddWater={data.handleAddWater}
              onSelectMood={data.handleSelectMood}
              toggleHabit={data.toggleHabit}
              toggleMedicine={data.toggleMedicine}
              isHabitCompleted={data.isHabitCompleted}
              isMedicineCompleted={data.isMedicineCompleted}
              showToast={showToast}
            />
          )}

          {/* ۷. باشگاه مغز */}
          {activeTab === 'brain_gym' && (
            <BrainGymView
              useJalaliCalendar={data.useJalaliCalendar}
              earnXp={gamification.earnXp}
              showToast={showToast}
              playAudioFeedback={gamification.playAudioFeedback}
            />
          )}

          {/* ۸. دستیار هوشمند */}
          {activeTab === 'assistant' && (
            <AssistantView
              userDataContext={{
                userName,
                waterToday: data.health.waterToday,
                sleepHours: data.health.sleepHours,
                sleepQuality: data.health.sleepQuality,
                moodScore: data.health.moodScore,
                pendingTasksToday: data.tasks.filter((t) => t.dueDate === data.selectedDateISO && t.status !== 'done').length,
                eventsToday: data.events.filter((e) => e.date === data.selectedDateISO).length,
                brainMetrics: data.brainMetrics,
                brainProfile: data.brainProfile,
                targetDate: data.selectedDateISO,
                clientToday: data.todayISO || new Date().toISOString().split('T')[0],
              }}
              onAddTask={(t: any) => {
                const targetDate = t.targetDate || t.dueDate || t.date || data.selectedDateISO;
                data.saveTasksToLocal([
                  ...data.lastSavedTasksRef.current,
                  {
                    id: crypto.randomUUID(),
                    title: t.title || 'کار جدید',
                    desc: t.content || '',
                    priority: (t.priority as any) || 'MEDIUM',
                    status: 'todo',
                    dueDate: targetDate,
                  },
                ]);
              }}
              onAddEvent={(e: any) => {
                const targetDate = e.targetDate || e.date || data.selectedDateISO;
                data.saveEventsToLocal([
                  ...data.lastSavedEventsRef.current,
                  {
                    id: crypto.randomUUID(),
                    title: e.title || 'رویداد جدید',
                    desc: e.content || '',
                    date: targetDate,
                    time: e.time || '12:00',
                    category: (e.category as any) || 'work',
                    recurrence: 'none',
                  },
                ]);
              }}
              onAddNote={(n: any) => {
                const targetDate = n.targetDate || n.updatedAt || data.selectedDateISO;
                data.saveNotesToLocal([
                  ...data.lastSavedNotesRef.current,
                  {
                    id: crypto.randomUUID(),
                    title: n.title || 'یادداشت جدید',
                    content: n.content || '',
                    folder: 'هوشمند',
                    tags: ['هوشمند'],
                    isPinned: false,
                    updatedAt: targetDate,
                  },
                ]);
              }}
              showToast={showToast}
              playAudioFeedback={gamification.playAudioFeedback}
            />
          )}

          {/* ۹. پیکربندی سامانه */}
          {activeTab === 'settings' && (
            <SettingsView
              fontSize={fontSize}
              setFontSize={setFontSize}
              useJalaliCalendar={data.useJalaliCalendar}
              onToggleCalendarType={data.toggleCalendarType}
              onExportBackup={exportBackupJSON}
            />
          )}

          {/* ۱۰. تیکت و پشتیبانی */}
          {activeTab === 'support' && (
            <SupportTabView
              useJalaliCalendar={data.useJalaliCalendar}
              onTicketsUpdate={(hasUnread) => data.setHasUnreadTickets(hasUnread)}
            />
          )}
        </main>
      </div>

      {/* ماژول‌های معلق، دیالوگ‌ها و اورلی‌ها */}
      <ZenFocusOverlay
        isOpen={isZenMode}
        onClose={() => setIsZenMode(false)}
        tasks={data.tasks}
        earnXp={gamification.earnXp}
        playAudioFeedback={gamification.playAudioFeedback}
        showToast={showToast}
      />

      <QuickActionModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        selectedDateISO={data.selectedDateISO}
        todayISO={data.todayISO}
        onAddTask={(t) => data.saveTasksToLocal([...data.lastSavedTasksRef.current, t])}
        onAddEvent={(e) => data.saveEventsToLocal([...data.lastSavedEventsRef.current, e])}
        onAddNote={(n) => data.saveNotesToLocal([...data.lastSavedNotesRef.current, n])}
        showToast={showToast}
      />

      <CommandPaletteModal
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        onTriggerZen={() => setIsZenMode(true)}
        onToggleCalendar={data.toggleCalendarType}
        onCreateBlankNote={() => {
          const freshNote: Note = {
            id: crypto.randomUUID(),
            title: 'یادداشت جدید بی‌نام',
            content: '# یادداشت جدید\n\n...',
            folder: 'یادداشت‌ها',
            tags: ['کار'],
            isPinned: false,
            updatedAt: new Date().toLocaleDateString('fa-IR'),
          };
          data.saveNotesToLocal([freshNote, ...data.notes]);
          setActiveNoteId(freshNote.id);
        }}
        onOpenNotesGraph={() => {}}
        onNavigateTab={handleTabChange}
        playAudioFeedback={gamification.playAudioFeedback}
        showToast={showToast}
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={onLogout}
      />

      <ToastNotificationBar toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}