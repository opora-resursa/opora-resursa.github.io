import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RegulationMethod } from './data/methods';
import { AppState, DiagnosticResult } from './types/app';
import {
  createEmptyState,
  loadAppState,
  saveAppState,
  validateImportedBackup,
} from './utils/storage';
import { TopNavAndRail, useActiveSection } from './components/TopNavAndRail';
import { HeroAndStory } from './components/HeroAndStory';
import { DiagnosticSection } from './components/DiagnosticSection';
import { CatalogSection } from './components/CatalogSection';
import { TrackerSection } from './components/TrackerSection';
import { ModalState, PracticeModal } from './components/PracticeModal';
import { LocalProfileFooter } from './components/LocalProfileFooter';
import {
  DEFAULT_PRINT_OPTIONS,
  PrintOptions,
  PrintPreviewModal,
  PrintSummary,
} from './components/PrintSummary';
import { Toast, ToastData } from './components/Toast';

function replaceSeedHabitOrAppend(
  habits: AppState['habits'],
  newRule: AppState['habits'][number]
): AppState['habits'] {
  if (typeof newRule.methodId !== 'number') {
    return [...habits, newRule];
  }
  let replaced = false;
  const next = habits.reduce<AppState['habits']>((acc, h) => {
    if (h.id.startsWith('seed-') && h.methodId === newRule.methodId) {
      if (!replaced) {
        acc.push(newRule);
        replaced = true;
      }
      return acc;
    }
    acc.push(h);
    return acc;
  }, []);
  if (!replaced) {
    next.push(newRule);
  }
  return next;
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>(
    DEFAULT_PRINT_OPTIONS
  );
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastIdRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);
  const habitsRef = useRef(state.habits);
  habitsRef.current = state.habits;
  const { activeSection, navigateToSection, scrollProgress, isDarkHeader } =
    useActiveSection();

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastIdRef.current += 1;
      const id = toastIdRef.current;
      setToast({ id, message, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast((curr) => (curr?.id === id ? null : curr));
        toastTimerRef.current = null;
      }, 3600);
    },
    []
  );

  const handleDiagnosticComplete = (result: DiagnosticResult) => {
    setState((prev) => ({ ...prev, diagnostic: result }));
    showToast('Оценка завершена — рекомендации обновлены');
  };

  const handleDiagnosticReset = () => {
    setState((prev) => ({ ...prev, diagnostic: null }));
    setOnlyRecommended(false);
  };

  const addHabitRule = useCallback(
    (trigger: string, action: string, methodId?: number) => {
      setState((prev) => ({
        ...prev,
        habits: [
          ...prev.habits,
          {
            id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            trigger,
            action,
            methodId,
            checks: [false, false, false, false, false, false, false],
          },
        ],
      }));
      showToast('Правило добавлено в трекер привычек');
    },
    [showToast]
  );

  const handleAddMethodToTracker = useCallback(
    (method: RegulationMethod) => {
      const isRealHabitForMethod = (h: AppState['habits'][number]) =>
        !h.id.startsWith('seed-') && h.methodId === method.id;

      if (habitsRef.current.some(isRealHabitForMethod)) {
        showToast('Эта практика уже есть в вашем трекере');
        return;
      }
      const trigger =
        method.defaultTrigger ??
        `Ситуация: ${method.situationTag.toLowerCase()}`;
      const action =
        method.defaultAction ??
        `Практика «${method.shortTitle}» (№${method.id})`;

      setState((prev) => {
        if (prev.habits.some(isRealHabitForMethod)) {
          return prev;
        }
        return {
          ...prev,
          habits: replaceSeedHabitOrAppend(prev.habits, {
            id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            trigger,
            action,
            methodId: method.id,
            checks: [false, false, false, false, false, false, false],
          }),
        };
      });
      showToast('Правило добавлено в трекер привычек');
    },
    [showToast]
  );

  const handleAddHabitFromModal = useCallback(
    (trigger: string, action: string, methodId: number) => {
      const normTrigger = trigger.trim().toLowerCase();
      const normAction = action.trim().toLowerCase();
      const hasDuplicate = (habits: AppState['habits']) =>
        habits.some(
          (h) =>
            !h.id.startsWith('seed-') &&
            ((methodId !== 8 && h.methodId === methodId) ||
              (h.trigger.trim().toLowerCase() === normTrigger &&
                h.action.trim().toLowerCase() === normAction))
        );

      if (hasDuplicate(habitsRef.current)) {
        setModal({ type: 'closed' });
        showToast('Эта практика уже есть в вашем трекере');
        return;
      }

      setState((prev) => {
        if (hasDuplicate(prev.habits)) {
          return prev;
        }
        return {
          ...prev,
          habits: replaceSeedHabitOrAppend(prev.habits, {
            id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            trigger,
            action,
            methodId,
            checks: [false, false, false, false, false, false, false],
          }),
        };
      });
      setModal({ type: 'closed' });
      showToast('Правило добавлено в трекер привычек');
    },
    [showToast]
  );

  const handleAddPlanToTracker = useCallback(
    (methods: RegulationMethod[]) => {
      const uniqueMethods = Array.from(
        new Map(methods.map((m) => [m.id, m])).values()
      );
      const existingIds = new Set(
        habitsRef.current
          .filter((h) => !h.id.startsWith('seed-'))
          .map((h) => h.methodId)
          .filter((id): id is number => typeof id === 'number')
      );
      const baseTs = Date.now();
      const newRules = uniqueMethods
        .filter((m) => !existingIds.has(m.id))
        .map((m, idx) => ({
          id: `habit-plan-${m.id}-${baseTs}-${idx}`,
          trigger:
            m.defaultTrigger ??
            `Ситуация: ${m.situationTag.toLowerCase()}`,
          action:
            m.defaultAction ??
            `Практика «${m.shortTitle}» (№${m.id})`,
          methodId: m.id,
          checks: [false, false, false, false, false, false, false],
        }));

      if (newRules.length === 0) {
        showToast('Эти практики уже есть в вашем трекере');
        return;
      }

      setState((prev) => {
        const prevIds = new Set(
          prev.habits
            .filter((h) => !h.id.startsWith('seed-'))
            .map((h) => h.methodId)
            .filter((id): id is number => typeof id === 'number')
        );
        const filtered = newRules.filter((r) => !prevIds.has(r.methodId));
        if (filtered.length === 0) return prev;
        let nextHabits = prev.habits;
        for (const rule of filtered) {
          nextHabits = replaceSeedHabitOrAppend(nextHabits, rule);
        }
        return {
          ...prev,
          habits: nextHabits,
        };
      });

      const count = newRules.length;
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) {
        showToast(`${count} рекомендованное правило добавлено в трекер`);
      } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        showToast(`${count} рекомендованных правила добавлены в трекер`);
      } else {
        showToast(`${count} рекомендованных правил добавлены в трекер`);
      }
    },
    [showToast]
  );

  const handleShowRecommendedInCatalog = () => {
    setOnlyRecommended(true);
    navigateToSection('catalog');
  };

  const handleUpdateHabit = (id: string, trigger: string, action: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === id ? { ...h, trigger, action } : h
      ),
    }));
    showToast('Правило обновлено');
  };

  const handleDeleteHabit = (id: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
    showToast('Правило удалено');
  };

  const handleToggleHabitDay = (id: string, dayIdx: number) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === id
          ? {
              ...h,
              checks: h.checks.map((v, idx) => (idx === dayIdx ? !v : v)),
            }
          : h
      ),
    }));
  };

  const handleSetResourceLevel = (dayIdx: number, level: number) => {
    setState((prev) => ({
      ...prev,
      resourceLevels: prev.resourceLevels.map((v, idx) =>
        idx === dayIdx ? level : v
      ),
      hasSampleResources: false,
    }));
  };

  const handleSaveThreeGood = (items: string[]) => {
    const cleaned = items.map((item) => item.trim()).filter(Boolean);
    if (cleaned.length === 0) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localIsoDate = `${year}-${month}-${day}`;
    const formattedDate = now.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });

    setState((prev) => ({
      ...prev,
      threeGoodThings: [
        {
          id: `refl-${Date.now()}`,
          dateLabel: formattedDate,
          isoDate: localIsoDate,
          items: cleaned,
        },
        ...prev.threeGoodThings,
      ],
    }));
    showToast('Итог дня сохранён');
  };

  const handleDeleteThreeGood = (id: string) => {
    setState((prev) => ({
      ...prev,
      threeGoodThings: prev.threeGoodThings.filter((entry) => entry.id !== id),
    }));
    showToast('Запись удалена');
  };

  const handleSaveWorksheet = (
    methodId: number,
    values: Record<string, string>
  ) => {
    setState((prev) => ({
      ...prev,
      worksheets: { ...prev.worksheets, [methodId]: values },
    }));
  };

  const handleClearWorksheet = (methodId: number) => {
    setState((prev) => {
      const next = { ...prev.worksheets };
      delete next[methodId];
      return { ...prev, worksheets: next };
    });
    showToast('Лист самонаблюдения очищен');
  };

  const handleSaveJournal = (methodId: number, text: string) => {
    setState((prev) => ({
      ...prev,
      journals: { ...prev.journals, [methodId]: text },
    }));
  };

  const handleWipeJournal = (methodId: number) => {
    setState((prev) => {
      const next = { ...prev.journals };
      delete next[methodId];
      return { ...prev, journals: next };
    });
    showToast('Запись удалена без следа');
  };

  const handleRestoreBackup = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const validated = validateImportedBackup(parsed);
      if (!validated) {
        showToast(
          'Не удалось прочитать резервную копию: неверный формат файла',
          'error'
        );
        return;
      }
      setState(validated);
      if (!validated.diagnostic) {
        setOnlyRecommended(false);
      }
      showToast('Резервная копия успешно восстановлена');
    } catch {
      showToast('Файл повреждён или не является корректным JSON', 'error');
    }
  };

  const handleClearSampleData = () => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => !h.id.startsWith('seed-')),
      resourceLevels: prev.hasSampleResources
        ? [null, null, null, null, null, null, null]
        : prev.resourceLevels,
      hasSampleResources: false,
      threeGoodThings: prev.threeGoodThings.filter((e) => !e.isSeed),
    }));
    showToast('Учебные примеры убраны');
  };

  const handleResetAllData = () => {
    setState(createEmptyState());
    setOnlyRecommended(false);
    showToast('Все локальные данные удалены');
  };

  const trackedMethodIds = useMemo(
    () =>
      state.habits
        .filter((h) => !h.id.startsWith('seed-'))
        .map((h) => h.methodId)
        .filter((id): id is number => typeof id === 'number'),
    [state.habits]
  );

  const handleGoToTracker = useCallback(() => {
    navigateToSection('tracker');
  }, [navigateToSection]);

  return (
    <>
      <TopNavAndRail
        activeSection={activeSection}
        onNavigate={navigateToSection}
        onOpenQuickSos={() => setModal({ type: 'sos-picker' })}
        scrollProgress={scrollProgress}
        isDarkHeader={isDarkHeader}
      />

      <main className="no-print">
        <HeroAndStory
          onOpenQuickSos={() => setModal({ type: 'sos-picker' })}
          onNavigate={navigateToSection}
        />

        <DiagnosticSection
          result={state.diagnostic}
          trackedMethodIds={trackedMethodIds}
          onComplete={handleDiagnosticComplete}
          onReset={handleDiagnosticReset}
          onOpenMethod={(method) => setModal({ type: 'method', method })}
          onAddPlanToTracker={handleAddPlanToTracker}
          onShowRecommendedInCatalog={handleShowRecommendedInCatalog}
          onGoToTracker={handleGoToTracker}
        />

        <CatalogSection
          recommendedIds={state.diagnostic?.recommendedIds ?? []}
          trackedMethodIds={trackedMethodIds}
          onlyRecommended={onlyRecommended}
          onToggleOnlyRecommended={setOnlyRecommended}
          onOpenMethod={(method) => setModal({ type: 'method', method })}
          onAddMethodToTracker={handleAddMethodToTracker}
          onGoToTracker={handleGoToTracker}
        />

        <TrackerSection
          habits={state.habits}
          resourceLevels={state.resourceLevels}
          hasSampleResources={Boolean(state.hasSampleResources)}
          todayIndex={state.todayIndex}
          threeGoodThings={state.threeGoodThings}
          onAddHabit={addHabitRule}
          onUpdateHabit={handleUpdateHabit}
          onDeleteHabit={handleDeleteHabit}
          onToggleHabitDay={handleToggleHabitDay}
          onSetResourceLevel={handleSetResourceLevel}
          onSaveThreeGood={handleSaveThreeGood}
          onDeleteThreeGood={handleDeleteThreeGood}
          onOpenMethod={(method) => setModal({ type: 'method', method })}
          onClearSampleData={handleClearSampleData}
        />
      </main>

      <LocalProfileFooter
        state={state}
        onRestoreBackup={handleRestoreBackup}
        onResetAllData={handleResetAllData}
        onOpenPrintPreview={() => setPrintPreviewOpen(true)}
      />

      <PrintSummary state={state} options={printOptions} />

      <PrintPreviewModal
        isOpen={printPreviewOpen}
        state={state}
        options={printOptions}
        onChangeOptions={setPrintOptions}
        onClose={() => setPrintPreviewOpen(false)}
      />

      <PracticeModal
        modal={modal}
        worksheets={state.worksheets}
        journals={state.journals}
        trackedMethodIds={trackedMethodIds}
        onClose={() => setModal({ type: 'closed' })}
        onSelectMethod={(method, fromSos) =>
          setModal({ type: 'method', method, fromSos })
        }
        onBackToSosPicker={() => setModal({ type: 'sos-picker' })}
        onSaveWorksheet={handleSaveWorksheet}
        onClearWorksheet={handleClearWorksheet}
        onSaveJournal={handleSaveJournal}
        onWipeJournal={handleWipeJournal}
        onAddHabitFromModal={handleAddHabitFromModal}
        onSaveToEvening={handleSaveThreeGood}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

export default App;
