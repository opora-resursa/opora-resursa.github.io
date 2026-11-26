import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BatteryCharging,
  CalendarCheck2,
  Check,
  ChevronDown,
  Edit3,
  HeartHandshake,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { METHODS, RegulationMethod } from '../data/methods';
import { HabitRule, ThreeGoodEntry } from '../types/app';
import { DAY_LABELS, formatEntryDateLabel } from '../utils/storage';
import { Reveal, ScrollStage, SectionBridge, useCursorSpotlight } from './Reveal';

type TrackerTab = 'habits' | 'energy' | 'evening';

interface TrackerSectionProps {
  habits: HabitRule[];
  resourceLevels: (number | null)[];
  todayIndex: number;
  threeGoodThings: ThreeGoodEntry[];
  onAddHabit: (trigger: string, action: string, methodId?: number) => void;
  onUpdateHabit: (id: string, trigger: string, action: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabitDay: (id: string, dayIdx: number) => void;
  onSetResourceLevel: (dayIdx: number, level: number) => void;
  onSaveThreeGood: (items: string[]) => void;
  onDeleteThreeGood: (id: string) => void;
  onOpenMethod: (method: RegulationMethod) => void;
  onClearSampleData?: () => void;
}

interface QuickPreset {
  methodId: number;
  chipLabel: string;
  trigger: string;
  action: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    methodId: 3,
    chipLabel: 'После разговора → 2 мин дыхания (№3)',
    trigger: 'Завершил(а) трудный разговор и чувствую напряжение',
    action: 'Делаю 2 минуты медленного комфортного дыхания с плавным выдохом (№3)',
  },
  {
    methodId: 10,
    chipLabel: 'В обед → 2 мин тишины (№10)',
    trigger: 'Наступает обеденный перерыв между задачами',
    action: 'Провожу 2 минуты в тишине без экрана и рабочих чатов (№10)',
  },
  {
    methodId: 11,
    chipLabel: 'Конец смены → список на завтра (№11)',
    trigger: 'Закрываю дверь кабинета в конце рабочего дня',
    action: 'Выписываю незавершённые дела на завтра и отключаю рабочие чаты (№11)',
  },
];

const ENERGY_FEELING_PRESETS: { value: number; label: string; shortLabel: string }[] = [
  { value: 2, label: 'Нет сил', shortLabel: 'Слабо' },
  { value: 4, label: 'Устал', shortLabel: 'Мало' },
  { value: 6, label: 'Норма', shortLabel: 'Норма' },
  { value: 8, label: 'Ровно', shortLabel: 'Ровно' },
  { value: 10, label: 'Опора', shortLabel: 'Опора' },
];

function getEnergyStateMeta(level: number | null): {
  label: string;
  pillClass: string;
  dotClass: string;
} {
  if (level === null) {
    return {
      label: 'не отмечено',
      pillClass: 'bg-[#EFE8DC] text-[#615875] border-[#1C1629]/15',
      dotClass: 'bg-[#857C99]',
    };
  }
  if (level <= 3) {
    return {
      label: 'истощение',
      pillClass: 'bg-[#F3E6EE] text-[#572B49] border-[#D9B8CE]',
      dotClass: 'bg-[#7A4469]',
    };
  }
  if (level <= 6) {
    return {
      label: 'умеренно',
      pillClass: 'bg-[#E4EEF7] text-[#264A6D] border-[#B4CDE4]',
      dotClass: 'bg-[#3D6A94]',
    };
  }
  return {
    label: 'есть опора',
    pillClass: 'bg-[#ECE6F6] text-[#38255C] border-[#CBBEE4]',
    dotClass: 'bg-[#523B7D]',
  };
}

function formatEntriesCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} запись`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} записи`;
  }
  return `${count} записей`;
}

export const TrackerSection: React.FC<TrackerSectionProps> = ({
  habits,
  resourceLevels,
  todayIndex,
  threeGoodThings,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onToggleHabitDay,
  onSetResourceLevel,
  onSaveThreeGood,
  onDeleteThreeGood,
  onOpenMethod,
  onClearSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<TrackerTab>('habits');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTrigger, setEditTrigger] = useState('');
  const [editAction, setEditAction] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(todayIndex);
  const [lastToggledKey, setLastToggledKey] = useState<string | null>(null);
  const rippleTimerRef = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useCursorSpotlight(sectionRef);

  const [good1, setGood1] = useState('');
  const [good2, setGood2] = useState('');
  const [good3, setGood3] = useState('');
  const [savedStampKey, setSavedStampKey] = useState(0);

  useEffect(() => {
    return () => {
      if (rippleTimerRef.current !== null) {
        window.clearTimeout(rippleTimerRef.current);
      }
    };
  }, []);

  const handleToggleDay = (habitId: string, dayIdx: number, wasChecked: boolean) => {
    if (rippleTimerRef.current !== null) {
      window.clearTimeout(rippleTimerRef.current);
      rippleTimerRef.current = null;
    }
    if (!wasChecked) {
      setLastToggledKey(`${habitId}-${dayIdx}`);
      rippleTimerRef.current = window.setTimeout(() => {
        setLastToggledKey(null);
        rippleTimerRef.current = null;
      }, 450);
    } else {
      setLastToggledKey(null);
    }
    onToggleHabitDay(habitId, dayIdx);
  };

  useEffect(() => {
    setSelectedDay(todayIndex);
  }, [todayIndex]);

  useEffect(() => {
    if (threeGoodThings.length === 0) {
      setSavedStampKey(0);
    }
  }, [threeGoodThings.length]);

  const hasSampleData =
    habits.some((h) => h.id.startsWith('seed-')) ||
    threeGoodThings.some((e) => e.isSeed);

  const todayChecked = useMemo(() => {
    return habits.filter((h) => Boolean(h.checks[todayIndex])).length;
  }, [habits, todayIndex]);

  const todayPct = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.round((todayChecked / habits.length) * 100);
  }, [habits.length, todayChecked]);

  const weeklyStats = useMemo(() => {
    const totalSlots = habits.length * 7;
    if (totalSlots === 0) return { checked: 0, pct: 0 };
    const checked = habits.reduce(
      (sum, h) => sum + h.checks.filter(Boolean).length,
      0
    );
    return {
      checked,
      pct: Math.round((checked / totalSlots) * 100),
    };
  }, [habits]);

  const dailyHabitCounts = useMemo(() => {
    return DAY_LABELS.map((_, dayIdx) =>
      habits.reduce((cnt, h) => cnt + (h.checks[dayIdx] ? 1 : 0), 0)
    );
  }, [habits]);

  const availablePresets = useMemo(() => {
    return QUICK_PRESETS.filter(
      (preset) => !habits.some((h) => h.methodId === preset.methodId)
    ).slice(0, 3);
  }, [habits]);

  const energyInsight = useMemo(() => {
    const daysWithEnergy = resourceLevels
      .map((level, idx) =>
        level !== null
          ? { level, habitsCount: dailyHabitCounts[idx] ?? 0 }
          : null
      )
      .filter((d): d is { level: number; habitsCount: number } => d !== null);

    if (daysWithEnergy.length < 2) {
      return 'Отмечайте уровень сил несколько дней подряд — график покажет связь между короткими паузами и вашим самочувствием.';
    }

    const withHabits = daysWithEnergy.filter((d) => d.habitsCount > 0);
    const withoutHabits = daysWithEnergy.filter((d) => d.habitsCount === 0);
    const fmt = (val: number) => val.toFixed(1).replace('.', ',');

    if (withHabits.length > 0 && withoutHabits.length > 0) {
      const avgWith =
        withHabits.reduce((sum, d) => sum + d.level, 0) / withHabits.length;
      const avgWithout =
        withoutHabits.reduce((sum, d) => sum + d.level, 0) / withoutHabits.length;

      if (avgWith > avgWithout + 0.15) {
        return `В дни с практиками средний уровень сил выше: ${fmt(avgWith)} против ${fmt(avgWithout)} из 10.`;
      }
      if (avgWith + 0.15 < avgWithout) {
        return `В дни с практиками средний уровень сил ${fmt(avgWith)} из 10 (против ${fmt(avgWithout)}): техники чаще включаются в более нагруженные дни.`;
      }
      return `Уровень сил в дни с практиками и без них пока близок (${fmt(avgWith)} из 10) — продолжайте наблюдения.`;
    }

    const overallAvg =
      daysWithEnergy.reduce((sum, d) => sum + d.level, 0) / daysWithEnergy.length;
    return `Средний уровень сил за ${daysWithEnergy.length} дн. — ${fmt(overallAvg)} из 10. Продолжайте отметки, чтобы видеть динамику недели.`;
  }, [resourceLevels, dailyHabitCounts]);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const tr = newTrigger.trim();
    const ac = newAction.trim();
    if (!tr || !ac) return;
    onAddHabit(tr, ac);
    setNewTrigger('');
    setNewAction('');
    setShowAddForm(false);
  };

  const startEdit = (habit: HabitRule) => {
    setEditingId(habit.id);
    setEditTrigger(habit.trigger);
    setEditAction(habit.action);
  };

  const saveEdit = (id: string) => {
    const tr = editTrigger.trim();
    const ac = editAction.trim();
    if (!tr || !ac) return;
    onUpdateHabit(id, tr, ac);
    setEditingId(null);
  };

  const handleSaveEvening = (e: React.FormEvent) => {
    e.preventDefault();
    const filled = [good1.trim(), good2.trim(), good3.trim()].filter(Boolean);
    if (filled.length === 0) return;
    onSaveThreeGood(filled);
    setGood1('');
    setGood2('');
    setGood3('');
    setSavedStampKey((k) => k + 1);
  };

  const todayEnergy = resourceLevels[todayIndex] ?? null;
  const todayEnergyMeta = getEnergyStateMeta(todayEnergy);

  const selectedDayLevel = resourceLevels[selectedDay] ?? null;
  const selectedDayMeta = getEnergyStateMeta(selectedDayLevel);
  const sliderDisplayValue = selectedDayLevel ?? 5;
  const sliderPct = ((sliderDisplayValue - 1) / 9) * 100;

  return (
    <section
      ref={sectionRef}
      id="tracker"
      className="no-print relative overflow-x-clip scroll-mt-24 bg-[#F5F0E5]"
    >
      <div
        aria-hidden="true"
        className="cursor-spotlight-light pointer-events-none absolute inset-0 z-0"
      />
      <div
        aria-hidden="true"
        className="cursor-spotlight-paper-grid pointer-events-none absolute inset-0 z-0"
      />

      <SectionBridge
        theme="light"
        label="Раздел 03 · Трекер недели"
        className="relative z-10"
      />

      <ScrollStage className="relative z-10">
        <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-14 lg:py-20 space-y-8">
        {/* Clean Newspaper Double-Top Rule Header */}
        <Reveal variant="clip-title">
          <div className="gazette-double-top pt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2.5 max-w-3xl">
              <span className="type-kicker text-[#523B7D]">
                Раздел 03 · Трекер недели · Привычки и самочувствие
              </span>
              <h2 className="font-gazette-tall text-3xl sm:text-4xl lg:text-[48px] text-[#1C1629]">
                ТРЕКЕР ВОССТАНОВЛЕНИЯ
              </h2>
              <p className="type-meta max-w-2xl">
                Свяжите короткую практику с привычным моментом дня — все отметки
                сохраняются автоматически.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Sleek Double-Lined Editorial Sheet Matching DiagnosticSection */}
        <Reveal variant="slide-up" delayMs={70}>
          <div className="relative">
            {/* Soft Balanced Dual Spotlights */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -left-12 w-96 h-96 rounded-full blur-3xl opacity-70"
              style={{
                background:
                  'radial-gradient(circle, rgba(107, 80, 158, 0.16) 0%, rgba(61, 106, 148, 0.08) 52%, transparent 74%)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 -right-10 w-96 h-96 rounded-full blur-3xl opacity-70"
              style={{
                background:
                  'radial-gradient(circle, rgba(61, 106, 148, 0.16) 0%, rgba(139, 176, 212, 0.08) 52%, transparent 74%)',
              }}
            />

            <div className="relative z-10 rounded-[26px] bg-[#FCF9F3] border border-[#523B7D]/22 p-2 sm:p-2.5 shadow-[0_14px_40px_-14px_rgba(42,26,74,0.12)]">
              <div className="rounded-[20px] border border-[#523B7D]/10 bg-[#FCF9F3] p-5 sm:p-8 lg:p-9">
                {/* ========================================================= */}
                {/* TOP 3 INTERACTIVE LIVE STATUS TAB CARDS                   */}
                {/* ========================================================= */}
                <div
                  role="tablist"
                  aria-label="Инструменты трекера восстановления"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-6 border-b border-[#1C1629]/10"
                >
                  {/* Tab 1 Card: Привычки недели */}
                  <button
                    id="tracker-tab-habits"
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'habits'}
                    aria-controls="tracker-panel-habits"
                    onClick={() => setActiveTab('habits')}
                    className={`group text-left rounded-2xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 border ${
                      activeTab === 'habits'
                        ? 'border-[#523B7D] bg-gradient-to-br from-[#ECE6F6]/70 via-[#FCF9F3] to-[#E4EEF7]/65 shadow-[0_10px_26px_-8px_rgba(82,59,125,0.26)] ring-1 ring-[#523B7D]/20'
                        : 'border-[#1C1629]/12 bg-[#F7F2E7]/75 hover:border-[#523B7D]/35 hover:bg-[#FCF9F3]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1C1629]">
                        <CalendarCheck2
                          className={`h-4 w-4 shrink-0 ${
                            activeTab === 'habits' ? 'text-[#523B7D]' : 'text-[#615875]'
                          }`}
                          aria-hidden="true"
                        />
                        <span>Привычки недели</span>
                      </span>
                      {habits.length > 0 && todayChecked === habits.length ? (
                        <span className="gazette-stamp slam whitespace-nowrap shrink-0 text-[#523B7D]">
                          ДЕНЬ ЗАКРЫТ
                        </span>
                      ) : (
                        <span className="font-gazette-mono text-[11px] font-semibold text-[#523B7D]">
                          {weeklyStats.pct}%
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-medium text-[#362E47]">
                          Сегодня: {todayChecked} из {habits.length}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden bg-[#E5DDD0]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              habits.length > 0
                                ? Math.max(todayChecked > 0 ? 8 : 0, todayPct)
                                : 0
                            }%`,
                            background: 'var(--grad-violet-deep)',
                          }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Tab 2 Card: Уровень сил */}
                  <button
                    id="tracker-tab-energy"
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'energy'}
                    aria-controls="tracker-panel-energy"
                    onClick={() => setActiveTab('energy')}
                    className={`group text-left rounded-2xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 border ${
                      activeTab === 'energy'
                        ? 'border-[#523B7D] bg-gradient-to-br from-[#E4EEF7]/75 via-[#FCF9F3] to-[#ECE6F6]/65 shadow-[0_10px_26px_-8px_rgba(82,59,125,0.26)] ring-1 ring-[#523B7D]/20'
                        : 'border-[#1C1629]/12 bg-[#F7F2E7]/75 hover:border-[#523B7D]/35 hover:bg-[#FCF9F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1C1629]">
                        <BatteryCharging
                          className={`h-4 w-4 shrink-0 ${
                            activeTab === 'energy' ? 'text-[#3D6A94]' : 'text-[#615875]'
                          }`}
                          aria-hidden="true"
                        />
                        <span>Уровень сил</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${todayEnergyMeta.pillClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${todayEnergyMeta.dotClass}`}
                          aria-hidden="true"
                        />
                        {todayEnergyMeta.label}
                      </span>
                    </div>

                    <p className="text-[13px] font-medium text-[#362E47]">
                      Сегодня:{' '}
                      <span className="font-semibold text-[#1C1629] tabular-nums">
                        {todayEnergy !== null ? `${todayEnergy} / 10` : 'не отмечено'}
                      </span>
                    </p>
                  </button>

                  {/* Tab 3 Card: Вечерний итог */}
                  <button
                    id="tracker-tab-evening"
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'evening'}
                    aria-controls="tracker-panel-evening"
                    onClick={() => setActiveTab('evening')}
                    className={`group text-left rounded-2xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 border ${
                      activeTab === 'evening'
                        ? 'border-[#523B7D] bg-gradient-to-br from-[#ECE6F6]/70 via-[#FCF9F3] to-[#F3E6EE]/60 shadow-[0_10px_26px_-8px_rgba(82,59,125,0.26)] ring-1 ring-[#523B7D]/20'
                        : 'border-[#1C1629]/12 bg-[#F7F2E7]/75 hover:border-[#523B7D]/35 hover:bg-[#FCF9F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1C1629]">
                        <Sparkles
                          className={`h-4 w-4 shrink-0 ${
                            activeTab === 'evening' ? 'text-[#7A4469]' : 'text-[#615875]'
                          }`}
                          aria-hidden="true"
                        />
                        <span>Вечерний итог</span>
                      </span>
                      <span className="font-gazette-mono text-[11px] font-semibold text-[#7A4469]">
                        {formatEntriesCount(threeGoodThings.length)}
                      </span>
                    </div>

                    <p className="text-[13px] font-medium text-[#362E47]">
                      3 хороших момента дня
                    </p>
                  </button>
                </div>

                {/* ========================================================= */}
                {/* TAB 1: SPACIOUS, EFFORTLESS HABIT TRACKER                 */}
                {/* ========================================================= */}
                {activeTab === 'habits' && (
                  <div
                    id="tracker-panel-habits"
                    role="tabpanel"
                    aria-labelledby="tracker-tab-habits"
                    className="pt-6 step-slide-in"
                  >
                    {/* Mobile Header Strip for Habit Formula + Clear Sample Data */}
                    <div className="flex md:hidden flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1C1629]/10">
                      <span className="type-kicker text-[#615875]">
                        Ваши правила «если — то»
                      </span>
                      {hasSampleData && onClearSampleData && (
                        <button
                          type="button"
                          onClick={onClearSampleData}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[#615875] bg-[#EFE8DC]/75 hover:bg-[#ECE6F6] hover:text-[#38255C] border border-[#1C1629]/12 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" aria-hidden="true" />
                          <span>Начать с чистого листа</span>
                        </button>
                      )}
                    </div>

                    {/* Single Aligned Desktop Weekday Header */}
                    <div className="hidden md:flex items-end justify-between gap-6 pb-3 border-b border-[#1C1629]/10">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="type-kicker text-[#615875]">
                          Ваши правила «если — то»
                        </span>
                        {hasSampleData && onClearSampleData && (
                          <button
                            type="button"
                            onClick={onClearSampleData}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[#615875] bg-[#EFE8DC]/75 hover:bg-[#ECE6F6] hover:text-[#38255C] border border-[#1C1629]/12 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" aria-hidden="true" />
                            <span>Начать с чистого листа</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 w-[336px] shrink-0 text-center">
                        {DAY_LABELS.map((dayLabel, idx) => {
                          const isToday = idx === todayIndex;
                          return (
                            <div
                              key={dayLabel}
                              className="flex flex-col items-center justify-end gap-1"
                            >
                              {isToday && (
                                <span className="rounded-full bg-[#E4EEF7] border border-[#B4CDE4] px-2 py-0.5 text-[10px] font-semibold text-[#264A6D] leading-none">
                                  Сегодня
                                </span>
                              )}
                              <span
                                className={`font-gazette-mono text-[11px] tracking-wider ${
                                  isToday
                                    ? 'font-bold text-[#264A6D]'
                                    : 'font-semibold text-[#615875]'
                                }`}
                              >
                                {dayLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {habits.length === 0 ? (
                      <div className="py-10 text-center text-[15px] text-[#615875]">
                        Пока нет активных правил. Добавьте своё правило ниже или
                        выберите готовый вариант в один клик.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#1C1629]/10">
                        {habits.map((habit, rowIdx) => {
                          const isEditing = editingId === habit.id;
                          const linkedMethod = habit.methodId
                            ? METHODS.find((m) => m.id === habit.methodId)
                            : undefined;

                          return (
                            <div key={habit.id}>
                              {isEditing ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    saveEdit(habit.id);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      e.stopPropagation();
                                      setEditingId(null);
                                    }
                                  }}
                                  className="my-3 rounded-2xl p-4 sm:p-5 bg-[#F7F2E7] border border-[#523B7D]/18 space-y-3"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label
                                        htmlFor={`edit-trigger-${habit.id}`}
                                        className="block type-micro font-semibold mb-1 text-[#615875]"
                                      >
                                        Если (ситуация-сигнал)
                                      </label>
                                      <input
                                        id={`edit-trigger-${habit.id}`}
                                        type="text"
                                        value={editTrigger}
                                        onChange={(e) => setEditTrigger(e.target.value)}
                                        className="w-full rounded-xl px-3.5 py-2 text-[14.5px] bg-[#FCF9F3] border border-[#1C1629]/20 text-[#1C1629] focus:outline-none focus:ring-2 focus:ring-[#523B7D] min-h-[42px]"
                                      />
                                    </div>
                                    <div>
                                      <label
                                        htmlFor={`edit-action-${habit.id}`}
                                        className="block type-micro font-semibold mb-1 text-[#615875]"
                                      >
                                        То (короткое действие)
                                      </label>
                                      <input
                                        id={`edit-action-${habit.id}`}
                                        type="text"
                                        value={editAction}
                                        onChange={(e) => setEditAction(e.target.value)}
                                        className="w-full rounded-xl px-3.5 py-2 text-[14.5px] bg-[#FCF9F3] border border-[#1C1629]/20 text-[#1C1629] focus:outline-none focus:ring-2 focus:ring-[#523B7D] min-h-[42px]"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="submit"
                                      disabled={!editTrigger.trim() || !editAction.trim()}
                                      className="btn-violet inline-flex items-center gap-1.5 rounded-xl px-4 py-2 type-pill disabled:opacity-45 disabled:cursor-not-allowed min-h-[40px] cursor-pointer"
                                    >
                                      <Save className="h-4 w-4" aria-hidden="true" />
                                      <span>Сохранить</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingId(null)}
                                      className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2 type-pill min-h-[40px] cursor-pointer"
                                    >
                                      <X className="h-4 w-4" aria-hidden="true" />
                                      <span>Отмена</span>
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-4 md:gap-6">
                                  {/* Left: Friendly Habit Text Hierarchy + Compact Actions */}
                                  <div className="flex-1 min-w-0 pt-5 md:py-5 space-y-2.5">
                                    <div className="space-y-1.5">
                                      <div className="flex items-start gap-2">
                                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-[#E4EEF7] text-[#264A6D] shrink-0 mt-0.5">
                                          Если
                                        </span>
                                        <p className="text-[13.5px] leading-snug text-[#5C5370]">
                                          {habit.trigger}
                                        </p>
                                      </div>

                                      <div className="flex items-start gap-2">
                                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-[#ECE6F6] text-[#38255C] shrink-0 mt-0.5">
                                          То
                                        </span>
                                        <p className="text-[15.5px] leading-snug font-semibold text-[#1C1629]">
                                          {habit.action}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                      {linkedMethod && (
                                        <button
                                          type="button"
                                          onClick={() => onOpenMethod(linkedMethod)}
                                          className="inline-flex items-center gap-1.5 text-[#523B7D] bg-[#ECE6F6]/75 hover:bg-[#ECE6F6] rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors cursor-pointer min-h-[36px]"
                                        >
                                          <Play
                                            className="w-3 h-3 fill-current"
                                            aria-hidden="true"
                                          />
                                          <span>Запустить практику</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => startEdit(habit)}
                                        aria-label="Редактировать правило"
                                        title="Редактировать"
                                        className="inline-flex items-center justify-center rounded-lg h-9 w-9 text-[#615875] opacity-75 hover:opacity-100 hover:text-[#523B7D] hover:bg-[#ECE6F6]/70 transition-all cursor-pointer"
                                      >
                                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => onDeleteHabit(habit.id)}
                                        aria-label="Удалить правило"
                                        title="Удалить"
                                        className="inline-flex items-center justify-center rounded-lg h-9 w-9 text-[#615875] opacity-75 hover:opacity-100 hover:text-[#7A4469] hover:bg-[#F3E6EE] transition-all cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Right: 7 Calm Circular Check Buttons with Today Column Tint */}
                                  <div
                                    className="grid grid-cols-7 gap-1 w-full md:w-[336px] md:gap-1.5 shrink-0 pb-5 md:pb-0"
                                    role="group"
                                    aria-label={`Отметки по дням для правила: ${habit.action}`}
                                  >
                                    {DAY_LABELS.map((dayLabel, dayIdx) => {
                                      const checked = Boolean(habit.checks[dayIdx]);
                                      const isToday = dayIdx === todayIndex;
                                      const todayColRadius = isToday
                                        ? `${rowIdx === 0 ? 'md:rounded-t-xl' : ''} ${
                                            rowIdx === habits.length - 1
                                              ? 'md:rounded-b-xl'
                                              : ''
                                          }`
                                        : '';

                                      return (
                                        <div
                                          key={dayLabel}
                                          className={`flex flex-col items-center justify-center gap-1.5 md:py-4 ${
                                            isToday
                                              ? `rounded-xl py-1.5 bg-[#E4EEF7]/45 md:rounded-none md:py-4 ${todayColRadius}`
                                              : 'py-1.5'
                                          }`}
                                        >
                                          <span
                                            className={`md:hidden font-gazette-mono text-[10.5px] leading-none ${
                                              isToday
                                                ? 'font-bold text-[#264A6D]'
                                                : 'text-[#615875]'
                                            }`}
                                          >
                                            {dayLabel}
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleToggleDay(habit.id, dayIdx, checked)
                                            }
                                            aria-pressed={checked}
                                            aria-label={`${dayLabel}${
                                              isToday ? ' (сегодня)' : ''
                                            }: ${checked ? 'выполнено' : 'не выполнено'}`}
                                            title={`${dayLabel}${isToday ? ' (сегодня)' : ''}`}
                                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full inline-flex items-center justify-center transition-all duration-150 cursor-pointer hover:-translate-y-[1px] active:translate-y-0 ${
                                              checked &&
                                              lastToggledKey === `${habit.id}-${dayIdx}`
                                                ? 'check-ripple '
                                                : ''
                                            }${
                                              checked
                                                ? 'btn-violet shadow-[0_4px_14px_rgba(82,59,125,0.38)]'
                                                : isToday
                                                ? 'bg-[#E4EEF7] ring-2 ring-[#3D6A94]/65 text-[#264A6D] hover:bg-[#D5E6F5]'
                                                : 'bg-[#EFE8DC] text-[#857C99] hover:bg-[#ECE6F6] hover:text-[#523B7D]'
                                            }`}
                                          >
                                            {checked ? (
                                              <Check
                                                className="h-4 w-4 stroke-[2.5]"
                                                aria-hidden="true"
                                              />
                                            ) : (
                                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                                            )}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Clean Bottom Quick-Add Strip */}
                    <div className="pt-5 mt-2 border-t border-[#1C1629]/10 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddForm((prev) => !prev)}
                          aria-expanded={showAddForm}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all cursor-pointer min-h-[38px] ${
                            showAddForm
                              ? 'btn-violet'
                              : 'bg-[#ECE6F6]/75 text-[#38255C] border border-[#CBBEE4] hover:bg-[#ECE6F6]'
                          }`}
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          <span>Добавить правило</span>
                        </button>

                        {availablePresets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowPresets((prev) => !prev)}
                            aria-expanded={showPresets}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all cursor-pointer min-h-[38px] ${
                              showPresets
                                ? 'bg-[#E4EEF7] text-[#264A6D] border border-[#8BB0D4]'
                                : 'bg-[#F7F2E7] text-[#362E47] border border-[#1C1629]/14 hover:border-[#8BB0D4] hover:bg-[#E4EEF7]/60 hover:text-[#264A6D]'
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-[#3D6A94]" aria-hidden="true" />
                            <span>Готовые идеи ({availablePresets.length})</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                                showPresets ? 'rotate-180' : ''
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>

                      {showPresets && availablePresets.length > 0 && (
                        <div className="pop-in flex flex-wrap items-center gap-2 pt-0.5">
                          {availablePresets.map((preset) => (
                            <button
                              key={preset.methodId}
                              type="button"
                              onClick={() =>
                                onAddHabit(preset.trigger, preset.action, preset.methodId)
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium bg-[#F7F2E7] text-[#362E47] border border-[#1C1629]/14 hover:border-[#8BB0D4] hover:bg-[#E4EEF7]/65 hover:text-[#264A6D] transition-colors cursor-pointer min-h-[38px]"
                            >
                              <Plus
                                className="h-3.5 w-3.5 text-[#3D6A94] shrink-0"
                                aria-hidden="true"
                              />
                              <span>{preset.chipLabel}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {showAddForm && (
                        <form
                          onSubmit={handleCreateHabit}
                          className="pop-in rounded-2xl p-4 sm:p-5 bg-[#F7F2E7] border border-[#523B7D]/16 space-y-3"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="habit-trigger-input"
                                className="block type-micro font-medium mb-1 text-[#362E47]"
                              >
                                Если (ситуация-сигнал)
                              </label>
                              <input
                                id="habit-trigger-input"
                                type="text"
                                value={newTrigger}
                                onChange={(e) => setNewTrigger(e.target.value)}
                                placeholder="Например: закончился трудный приём"
                                className="w-full rounded-xl px-3.5 py-2.5 text-[14.5px] bg-[#FCF9F3] border border-[#1C1629]/18 text-[#1C1629] placeholder:text-[#857C99] focus:outline-none focus:ring-2 focus:ring-[#523B7D] min-h-[42px]"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="habit-action-input"
                                className="block type-micro font-medium mb-1 text-[#362E47]"
                              >
                                То (короткое действие)
                              </label>
                              <input
                                id="habit-action-input"
                                type="text"
                                value={newAction}
                                onChange={(e) => setNewAction(e.target.value)}
                                placeholder="Например: 2 мин дыхания у окна"
                                className="w-full rounded-xl px-3.5 py-2.5 text-[14.5px] bg-[#FCF9F3] border border-[#1C1629]/18 text-[#1C1629] placeholder:text-[#857C99] focus:outline-none focus:ring-2 focus:ring-[#523B7D] min-h-[42px]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="submit"
                              disabled={!newTrigger.trim() || !newAction.trim()}
                              className="btn-violet inline-flex items-center gap-1.5 rounded-xl px-4 py-2 type-pill disabled:opacity-45 disabled:cursor-not-allowed min-h-[40px] cursor-pointer"
                            >
                              <Plus className="h-4 w-4" aria-hidden="true" />
                              <span>Добавить</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddForm(false)}
                              className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2 type-pill min-h-[40px] cursor-pointer"
                            >
                              <span>Отмена</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: SPACIOUS, FRIENDLY ENERGY & RESOURCE MONITOR       */}
                {/* ========================================================= */}
                {activeTab === 'energy' && (
                  <div
                    id="tracker-panel-energy"
                    role="tabpanel"
                    aria-labelledby="tracker-tab-energy"
                    className="pt-6 step-slide-in grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left (5/12): Segmented Day Switcher + Presets + Slider */}
                    <div className="lg:col-span-5 space-y-5">
                      <div className="space-y-1">
                        <span className="type-kicker text-[#3D6A94]">
                          Самочувствие по дням
                        </span>
                        <h3 className="font-editorial text-xl sm:text-2xl text-[#1C1629]">
                          Как вы оцениваете запас сил ({DAY_LABELS[selectedDay]})?
                        </h3>
                      </div>

                      {/* Segmented Day Switcher */}
                      <div
                        className="grid grid-cols-7 gap-1 p-1.5 rounded-2xl bg-[#EFE8DC]/80 border border-[#523B7D]/12"
                        role="group"
                        aria-label="Выбор дня недели"
                      >
                        {DAY_LABELS.map((label, idx) => {
                          const active = selectedDay === idx;
                          const isToday = idx === todayIndex;
                          return (
                            <button
                              key={label}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setSelectedDay(idx)}
                              className={`relative flex items-center justify-center gap-1 rounded-xl py-2 text-[12.5px] font-semibold transition-all duration-150 min-h-[38px] cursor-pointer ${
                                active
                                  ? 'btn-sky shadow-sm'
                                  : 'text-[#362E47] hover:bg-[#FCF9F3] hover:text-[#264A6D]'
                              }`}
                            >
                              <span>{label}</span>
                              {isToday && (
                                <span
                                  aria-label="сегодня"
                                  title="Сегодня"
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    active ? 'bg-[#FCF9F3]' : 'bg-[#3D6A94]'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Large Tabular Readout + State Pill */}
                      <div className="rounded-2xl p-4 sm:p-5 bg-[#F7F2E7] border border-[#1C1629]/12 space-y-4">
                        <div
                          key={selectedDay}
                          className="animate-fade-in flex items-center justify-between gap-3"
                        >
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-num text-4xl leading-none text-[#1C1629] tabular-nums">
                              {selectedDayLevel !== null ? selectedDayLevel : '—'}
                            </span>
                            <span className="font-gazette-mono text-sm text-[#615875]">
                              / 10
                            </span>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${selectedDayMeta.pillClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${selectedDayMeta.dotClass}`}
                              aria-hidden="true"
                            />
                            {selectedDayMeta.label}
                          </span>
                        </div>

                        {/* Smooth 1-10 Range Slider */}
                        <div className="space-y-2">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            step={1}
                            value={sliderDisplayValue}
                            aria-label={`Уровень сил (${DAY_LABELS[selectedDay]}) от 1 до 10`}
                            onChange={(e) =>
                              onSetResourceLevel(selectedDay, Number(e.target.value))
                            }
                            onClick={() => {
                              if (selectedDayLevel === null) {
                                onSetResourceLevel(selectedDay, sliderDisplayValue);
                              }
                            }}
                            className="energy-range"
                            style={{
                              background: `linear-gradient(90deg, #523B7D 0%, #3D6A94 ${sliderPct}%, #E5DDD0 ${sliderPct}%, #E5DDD0 100%)`,
                            }}
                          />
                          <div className="flex items-center justify-between text-[11.5px] text-[#615875]">
                            <span>1 · нет сил</span>
                            <span>10 · максимум опоры</span>
                          </div>
                        </div>

                        {/* 5 Quick Human Feeling Presets */}
                        <div className="space-y-1.5 pt-1">
                          <span className="block type-micro text-[#615875]">
                            Быстрая отметка по ощущению:
                          </span>
                          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                            {ENERGY_FEELING_PRESETS.map((preset) => {
                              const active = selectedDayLevel === preset.value;
                              return (
                                <button
                                  key={preset.value}
                                  type="button"
                                  onClick={() =>
                                    onSetResourceLevel(selectedDay, preset.value)
                                  }
                                  className={`min-w-0 rounded-xl px-0.5 sm:px-2 py-2 text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                    active
                                      ? 'btn-violet shadow-[0_4px_14px_-2px_rgba(82,59,125,0.4)]'
                                      : 'bg-[#FCF9F3] text-[#1C1629] border border-[#1C1629]/12 hover:border-[#523B7D]/40 hover:bg-[#ECE6F6]/45'
                                  }`}
                                >
                                  <span className="font-gazette-mono text-[12px] font-bold leading-none">
                                    {preset.value}
                                  </span>
                                  <span
                                    className={`text-[10.5px] sm:text-[11px] leading-tight truncate max-w-full ${
                                      active ? 'text-[#FAF6EE]/95' : 'text-[#615875]'
                                    }`}
                                  >
                                    <span className="sm:hidden">{preset.shortLabel}</span>
                                    <span className="hidden sm:inline">{preset.label}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right (7/12): 7-Day SVG Chart + Automatic Plain-Russian Insight */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden bg-[#F7F2E7] border border-[#1C1629]/12">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 type-micro text-[#615875]">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#3D6A94]" />
                            <span>Уровень сил (1–10)</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded bg-[#523B7D]/35" />
                            <span>Выполнено практик</span>
                          </span>
                        </div>

                        <ResourceSparkline
                          levels={resourceLevels}
                          habitCounts={dailyHabitCounts}
                          maxHabits={Math.max(1, habits.length)}
                          todayIndex={todayIndex}
                        />
                      </div>

                      <p className="rounded-xl px-4 py-3 bg-[#E4EEF7]/65 border border-[#B4CDE4]/80 text-[13.5px] leading-snug text-[#264A6D]">
                        {energyInsight}
                      </p>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: COZY, UNCLUTTERED EVENING REFLECTION (METHOD №28)  */}
                {/* ========================================================= */}
                {activeTab === 'evening' && (
                  <div
                    id="tracker-panel-evening"
                    role="tabpanel"
                    aria-labelledby="tracker-tab-evening"
                    className="pt-6 step-slide-in grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left (6/12): Calm Prompt & 3 Spacious Numbered Inputs */}
                    <div
                      className="lg:col-span-6 rounded-2xl border border-[#7A4469]/18 p-5 sm:p-6 space-y-4"
                      style={{
                        background:
                          'linear-gradient(155deg, #FCF9F3 0%, #ECE6F6 100%)',
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-3">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 type-kicker text-[#7A4469]">
                            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>Метод №28 · М. Селигман / Дж. Б. Секстон</span>
                          </div>
                          <h3 className="font-editorial text-xl sm:text-2xl text-[#1C1629]">
                            Вечерняя опора: 3 хороших момента
                          </h3>
                        </div>

                        {savedStampKey > 0 && (
                          <span
                            key={savedStampKey}
                            className="gazette-stamp slam self-start shrink-0 text-[#264A6D]"
                          >
                            Сохранено ✓
                          </span>
                        )}
                      </div>

                      <p className="type-meta">
                        Вспомните до трёх небольших хороших моментов сегодняшнего
                        дня — даже самых простых. Если день был тяжёлым,
                        достаточно записать даже один спокойный момент.
                      </p>

                      <form onSubmit={handleSaveEvening} className="space-y-3">
                        <div className="relative">
                          <span className="font-gazette-mono text-[12px] font-semibold text-[#7A4469] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            1.
                          </span>
                          <input
                            type="text"
                            value={good1}
                            onChange={(e) => setGood1(e.target.value)}
                            placeholder="Что было спокойным или тёплым?"
                            aria-label="Первый хороший момент"
                            className="w-full rounded-xl pl-10 pr-4 py-3 text-[14.5px] bg-[#F7F2E7] border border-[#1C1629]/15 text-[#1C1629] placeholder:text-[#857C99] focus:outline-none focus:ring-2 focus:ring-[#523B7D] focus:bg-[#FCF9F3] min-h-[46px] transition-colors"
                          />
                        </div>

                        <div className="relative">
                          <span className="font-gazette-mono text-[12px] font-semibold text-[#7A4469] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            2.
                          </span>
                          <input
                            type="text"
                            value={good2}
                            onChange={(e) => setGood2(e.target.value)}
                            placeholder="Какая небольшая поддержка случилась?"
                            aria-label="Второй хороший момент"
                            className="w-full rounded-xl pl-10 pr-4 py-3 text-[14.5px] bg-[#F7F2E7] border border-[#1C1629]/15 text-[#1C1629] placeholder:text-[#857C99] focus:outline-none focus:ring-2 focus:ring-[#523B7D] focus:bg-[#FCF9F3] min-h-[46px] transition-colors"
                          />
                        </div>

                        <div className="relative">
                          <span className="font-gazette-mono text-[12px] font-semibold text-[#7A4469] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            3.
                          </span>
                          <input
                            type="text"
                            value={good3}
                            onChange={(e) => setGood3(e.target.value)}
                            placeholder="Что удалось сделать бережно к себе?"
                            aria-label="Третий хороший момент"
                            className="w-full rounded-xl pl-10 pr-4 py-3 text-[14.5px] bg-[#F7F2E7] border border-[#1C1629]/15 text-[#1C1629] placeholder:text-[#857C99] focus:outline-none focus:ring-2 focus:ring-[#523B7D] focus:bg-[#FCF9F3] min-h-[46px] transition-colors"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!good1.trim() && !good2.trim() && !good3.trim()}
                          className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill disabled:opacity-45 disabled:cursor-not-allowed min-h-[44px] cursor-pointer"
                        >
                          <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                          <span>Сохранить вечернюю запись</span>
                        </button>
                      </form>
                    </div>

                    {/* Right (6/12): Clean Timeline of Saved Entries */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="type-kicker text-[#615875]">
                          Лента сохранённых моментов
                        </span>
                        <span className="font-gazette-mono text-[11.5px] text-[#615875]">
                          {formatEntriesCount(threeGoodThings.length)}
                        </span>
                      </div>

                      {threeGoodThings.length === 0 ? (
                        <div className="rounded-2xl p-6 bg-[#F7F2E7]/85 border border-[#1C1629]/10 text-[14.5px] leading-relaxed text-[#615875]">
                          Пока нет сохранённых записей. Добавьте до трёх
                          моментов дня в форме — они появятся в этой ленте.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[390px] overflow-y-auto pr-1">
                          {threeGoodThings.map((entry) => (
                            <article
                              key={entry.id}
                              className="rounded-2xl p-4 space-y-2 bg-[#F7F2E7]/85 border border-[#1C1629]/10"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="type-kicker text-[#523B7D]">
                                  {formatEntryDateLabel(entry)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => onDeleteThreeGood(entry.id)}
                                  aria-label="Удалить запись"
                                  title="Удалить запись"
                                  className="inline-flex items-center justify-center rounded-lg h-7 w-7 text-[#857C99] hover:text-[#7A4469] hover:bg-[#F3E6EE] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                              </div>
                              <ul className="space-y-1 text-[14px] leading-relaxed text-[#1C1629]">
                                {entry.items.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-[#3D6A94] font-semibold">
                                      ·
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
        </div>
      </ScrollStage>
    </section>
  );
};

/* Generous 7-Day SVG Area + Line + Habit-Bars Chart */
const ResourceSparkline: React.FC<{
  levels: (number | null)[];
  habitCounts: number[];
  maxHabits: number;
  todayIndex: number;
}> = ({ levels, habitCounts, maxHabits, todayIndex }) => {
  const width = 480;
  const height = 190;
  const padX = 32;
  const padTop = 26;
  const padBottom = 30;
  const plotH = height - padTop - padBottom;
  const stepX = (width - padX * 2) / 6;
  const baselineY = padTop + plotH;

  const getX = (i: number) => padX + i * stepX;
  const getY = (val: number) => padTop + plotH - ((val - 1) / 9) * plotH;

  const validPoints = levels
    .map((v, i) => (v !== null ? { i, x: getX(i), y: getY(v), v } : null))
    .filter((p): p is { i: number; x: number; y: number; v: number } => p !== null);

  const linePath =
    validPoints.length >= 2
      ? `M ${validPoints[0].x.toFixed(1)} ${validPoints[0].y.toFixed(1)} ${validPoints
          .slice(1)
          .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(' ')}`
      : '';

  const areaPath =
    validPoints.length >= 2
      ? `M ${validPoints[0].x.toFixed(1)} ${baselineY.toFixed(1)} ${validPoints
          .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(' ')} L ${validPoints[validPoints.length - 1].x.toFixed(
          1
        )} ${baselineY.toFixed(1)} Z`
      : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="График уровня сил и выполненных практик за неделю"
    >
      <defs>
        <linearGradient id="resource-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3D6A94" stopOpacity="0.26" />
          <stop offset="65%" stopColor="#8BB0D4" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#8BB0D4" stopOpacity="0.0" />
        </linearGradient>
        <filter id="sparkline-line-glow" x="-15%" y="-30%" width="130%" height="160%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2.5"
            floodColor="#3D6A94"
            floodOpacity="0.45"
          />
        </filter>
        <filter id="sparkline-dot-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2.5"
            floodColor="#523B7D"
            floodOpacity="0.50"
          />
        </filter>
      </defs>

      {[1, 5, 10].map((lvl) => {
        const y = getY(lvl);
        return (
          <g key={lvl}>
            <line
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="rgba(28, 22, 41, 0.14)"
              strokeDasharray="3 3"
            />
            <text
              x={8}
              y={y + 4}
              fill="#615875"
              className="text-[10.5px] font-gazette-mono"
            >
              {lvl}
            </text>
          </g>
        );
      })}

      <line
        x1={padX}
        y1={baselineY}
        x2={width - padX}
        y2={baselineY}
        stroke="rgba(28, 22, 41, 0.18)"
        strokeWidth={1}
      />

      {habitCounts.map((cnt, i) => {
        if (cnt <= 0) return null;
        const barH = (cnt / maxHabits) * (plotH * 0.55);
        const barW = 18;
        return (
          <rect
            key={i}
            x={getX(i) - barW / 2}
            y={baselineY - barH}
            width={barW}
            height={Math.max(2, barH)}
            rx={4}
            fill="#523B7D"
            fillOpacity={0.22}
          />
        );
      })}

      {areaPath && <path d={areaPath} fill="url(#resource-area-grad)" />}

      {validPoints.length >= 2 && (
        <path
          d={linePath}
          className="svg-line-draw"
          fill="none"
          stroke="#3D6A94"
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#sparkline-line-glow)"
        />
      )}

      {DAY_LABELS.map((label, i) => {
        const x = getX(i);
        const val = levels[i];
        const isToday = i === todayIndex;
        return (
          <g key={label}>
            {val !== null && (
              <>
                <circle
                  cx={x}
                  cy={getY(val)}
                  r={5}
                  fill="#FCF9F3"
                  stroke="#523B7D"
                  strokeWidth={2.5}
                  filter="url(#sparkline-dot-glow)"
                />
                <text
                  x={x}
                  y={getY(val) - 10}
                  textAnchor="middle"
                  fill="#1C1629"
                  className="text-[11px] font-semibold font-gazette-mono"
                >
                  {val}
                </text>
              </>
            )}
            <text
              x={x}
              y={height - 7}
              textAnchor="middle"
              fill={isToday ? '#523B7D' : '#615875'}
              className={`text-[11px] font-gazette-mono ${isToday ? 'font-bold' : ''}`}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
