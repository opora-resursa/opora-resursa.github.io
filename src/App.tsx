import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RegulationMethod } from './data/methods';
import { AppState, DiagnosticResult } from './types/app';
import {
  createDefaultState,
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

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToast({ id, message });
    toastTimerRef.current = window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
      toastTimerRef.current = null;
    }, 3600);
  }, []);

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
      if (state.habits.some((h) => h.methodId === method.id)) {
        showToast('Эта практика уже есть в вашем трекере');
        return;
      }
      const trigger =
        method.defaultTrigger ??
        `Ситуация: ${method.situationTag.toLowerCase()}`;
      const action =
        method.defaultAction ??
        `Практика «${method.shortTitle}» (№${method.id})`;
      addHabitRule(trigger, action, method.id);
    },
    [state.habits, addHabitRule, showToast]
  );

  const handleAddPlanToTracker = useCallback(
    (methods: RegulationMethod[]) => {
      const newRules = methods
        .filter((m) => !state.habits.some((h) => h.methodId === m.id))
        .map((m) => ({
          id: `habit-plan-${m.id}-${Date.now()}`,
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
        const filtered = newRules.filter(
          (r) => !prev.habits.some((h) => h.methodId === r.methodId)
        );
        if (filtered.length === 0) return prev;
        return {
          ...prev,
          habits: [...prev.habits, ...filtered],
        };
      });

      showToast(
        newRules.length === 1
          ? '1 рекомендованное правило добавлено в трекер'
          : 'Два рекомендованных правила добавлены в ваш трекер'
      );
    },
    [state.habits, showToast]
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
        showToast('Не удалось прочитать резервную копию: неверный формат файла');
        return;
      }
      setState(validated);
      if (!validated.diagnostic) {
        setOnlyRecommended(false);
      }
      showToast('Резервная копия успешно восстановлена');
    } catch {
      showToast('Файл повреждён или не является корректным JSON');
    }
  };

  const handleClearSampleData = () => {
    setState(createEmptyState());
    setOnlyRecommended(false);
    showToast('Трекер очищен — можно заполнять с чистого листа');
  };

  const handleResetAllData = () => {
    const fresh = createDefaultState();
    setState(fresh);
    setOnlyRecommended(false);
    showToast('Локальные данные очищены');
  };

  const trackedMethodIds = useMemo(
    () =>
      state.habits
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
        onClose={() => setModal({ type: 'closed' })}
        onSelectMethod={(method, fromSos) =>
          setModal({ type: 'method', method, fromSos })
        }
        onBackToSosPicker={() => setModal({ type: 'sos-picker' })}
        onSaveWorksheet={handleSaveWorksheet}
        onClearWorksheet={handleClearWorksheet}
        onSaveJournal={handleSaveJournal}
        onWipeJournal={handleWipeJournal}
        onAddHabitFromModal={(trigger, action, methodId) => {
          addHabitRule(trigger, action, methodId);
          setModal({ type: 'closed' });
        }}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

export default App;
