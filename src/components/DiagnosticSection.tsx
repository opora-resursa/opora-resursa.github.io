import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  HeartHandshake,
  PlusCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ClusterId, CLUSTER_META, METHODS, RegulationMethod } from '../data/methods';
import { DiagnosticAnswers, DiagnosticResult } from '../types/app';
import { pickRecommendedMethods } from '../utils/storage';
import { Reveal } from './Reveal';

interface DiagnosticQuestion {
  id: string;
  axis: ClusterId;
  text: string;
  hint: string;
}

const QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'q1',
    axis: 'body',
    text: 'К концу рабочего дня вы чувствуете стойкий зажим в шее, плечах, челюсти или пояснице?',
    hint: 'Накопленное напряжение в теле',
  },
  {
    id: 'q2',
    axis: 'body',
    text: 'Замечаете ли вы поверхностное дыхание, сердцебиение или внутреннюю дрожь после сложных разговоров?',
    hint: 'Телесная реакция на стресс',
  },
  {
    id: 'q3',
    axis: 'mind',
    text: 'Мысли возвращаются к трудным рабочим эпизодам, сомнениям или самокритике уже дома, вне смены?',
    hint: 'Навязчивые мысли о работе дома',
  },
  {
    id: 'q4',
    axis: 'mind',
    text: 'Появляется ли ощущение эмоционального притупления, раздражительности или желание отгородиться от людей?',
    hint: 'Эмоциональная усталость',
  },
  {
    id: 'q5',
    axis: 'boundaries',
    text: 'Приходится ли вам работать подряд без коротких пауз между приёмами, уроками или блоками документации?',
    hint: 'Нехватка микроперерывов в течение смены',
  },
  {
    id: 'q6',
    axis: 'boundaries',
    text: 'Сложно ли вам спокойно отказывать в дополнительных поручениях и отключать рабочие чаты вечером?',
    hint: 'Границы между работой и личным временем',
  },
  {
    id: 'q7',
    axis: 'resource',
    text: 'Возникает ли чувство, что даже после выходных внутренний запас сил почти не восстанавливается?',
    hint: 'Восстановление сил после отдыха',
  },
  {
    id: 'q8',
    axis: 'resource',
    text: 'Стало ли труднее замечать в обычном дне небольшие тёплые моменты и смысл своей работы?',
    hint: 'Ощущение смысла и тепла в обычном дне',
  },
];

const AXIS_DOT_GLOW: Record<ClusterId, string> = {
  body: '0 0 8px rgba(61, 106, 148, 0.48)',
  mind: '0 0 8px rgba(82, 59, 125, 0.48)',
  boundaries: '0 0 8px rgba(122, 68, 105, 0.48)',
  resource: '0 0 8px rgba(61, 106, 148, 0.48)',
};

const SCALE_OPTIONS = [
  { value: 0, label: 'Почти никогда' },
  { value: 1, label: 'Редко' },
  { value: 2, label: 'Иногда' },
  { value: 3, label: 'Часто' },
  { value: 4, label: 'Почти каждый день' },
];

const AXIS_DISPLAY: Record<
  ClusterId,
  { title: string; short: string; colorVar: string; advice: string }
> = {
  body: {
    title: 'Телесное напряжение',
    short: 'Тело',
    colorVar: 'var(--sky)',
    advice:
      'Тело дольше удерживает режим мобилизации. Здесь лучше всего сработают короткие соматические сбросы напряжения и плавное дыхание прямо в перерывах.',
  },
  mind: {
    title: 'Мысли и эмоции',
    short: 'Мысли',
    colorVar: 'var(--violet)',
    advice:
      'Основная трата сил идёт через прокручивание рабочих ситуаций и повышенные требования к себе. Помогут техники переключения внимания, самосострадание и структурирование мыслей.',
  },
  boundaries: {
    title: 'Границы и отдых',
    short: 'Границы',
    colorVar: 'var(--plum)',
    advice:
      'Граница между сменой и личным временем размывается. Опорой станут микроперерывы, ритуал завершения рабочего дня и заранее подготовленные планы «если — то».',
  },
  resource: {
    title: 'Дефицит ресурса',
    short: 'Ресурс',
    colorVar: 'var(--sky)',
    advice:
      'Фоновый запас эмоциональной энергии снижен, и обычные дела даются тяжелее. Важно бережно возвращать внимание к простым источникам радости и поддержки.',
  },
};

export interface DiagnosticSectionProps {
  result: DiagnosticResult | null;
  trackedMethodIds?: number[];
  onComplete: (result: DiagnosticResult) => void;
  onReset: () => void;
  onOpenMethod: (method: RegulationMethod) => void;
  onAddPlanToTracker: (methods: RegulationMethod[]) => void;
  onShowRecommendedInCatalog: () => void;
  onGoToTracker?: () => void;
}

export const DiagnosticSection: React.FC<DiagnosticSectionProps> = ({
  result,
  trackedMethodIds,
  onComplete,
  onReset,
  onOpenMethod,
  onAddPlanToTracker,
  onShowRecommendedInCatalog,
  onGoToTracker,
}) => {
  const [answers, setAnswers] = useState<DiagnosticAnswers>(result?.answers ?? {});
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isEditingAnswers, setIsEditingAnswers] = useState(false);
  const [planAdded, setPlanAdded] = useState(false);
  const [animatedAverage, setAnimatedAverage] = useState(0);
  const advanceTimerRef = useRef<number | null>(null);
  const questionnaireRef = useRef<HTMLDivElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAdvanceTimer();
    };
  }, []);

  useEffect(() => {
    clearAdvanceTimer();
    if (!result) {
      setAnswers({});
      setActiveStep(0);
      setIsEditingAnswers(false);
      setPlanAdded(false);
      return;
    }
    setAnswers(result.answers ?? {});
    setIsEditingAnswers(false);
  }, [result]);

  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / QUESTIONS.length) * 100);

  const finalizeDiagnostic = (next: DiagnosticAnswers) => {
    clearAdvanceTimer();
    const scores: Record<ClusterId, number> = {
      body: 0,
      mind: 0,
      boundaries: 0,
      resource: 0,
    };

    for (const axis of ['body', 'mind', 'boundaries', 'resource'] as ClusterId[]) {
      const axisQs = QUESTIONS.filter((q) => q.axis === axis);
      const sum = axisQs.reduce((acc, q) => acc + (next[q.id] ?? 0), 0);
      const max = axisQs.length * 4;
      scores[axis] = Math.round((sum / max) * 100);
    }

    const { topAxes, recommendedIds } = pickRecommendedMethods(scores);

    const computed: DiagnosticResult = {
      answers: next,
      scores,
      topAxes,
      recommendedIds,
      completedAt: new Date().toISOString(),
    };
    setPlanAdded(false);
    setIsEditingAnswers(false);
    onComplete(computed);
  };

  const handleSelectAnswer = (questionId: string, value: number) => {
    clearAdvanceTimer();

    const next = { ...answers, [questionId]: value };
    setAnswers(next);

    if (!isEditingAnswers && Object.keys(next).length === QUESTIONS.length) {
      advanceTimerRef.current = window.setTimeout(() => {
        finalizeDiagnostic(next);
      }, 220);
      return;
    }

    if (isEditingAnswers) {
      if (activeStep < QUESTIONS.length - 1) {
        shouldRestoreFocusRef.current = Boolean(
          questionnaireRef.current?.contains(document.activeElement)
        );
        advanceTimerRef.current = window.setTimeout(() => {
          setActiveStep((s) => Math.min(QUESTIONS.length - 1, s + 1));
        }, 220);
      }
      return;
    }

    // Smoothly advance to the next unanswered question
    const nextUnansweredAfter = QUESTIONS.findIndex(
      (q, idx) => idx > activeStep && next[q.id] === undefined
    );
    const firstUnanswered = QUESTIONS.findIndex((q) => next[q.id] === undefined);
    const targetStep =
      nextUnansweredAfter !== -1
        ? nextUnansweredAfter
        : firstUnanswered !== -1
        ? firstUnanswered
        : Math.min(QUESTIONS.length - 1, activeStep + 1);

    shouldRestoreFocusRef.current = Boolean(
      questionnaireRef.current?.contains(document.activeElement)
    );
    advanceTimerRef.current = window.setTimeout(() => {
      setActiveStep(targetStep);
    }, 220);
  };

  const handleStepClick = (idx: number) => {
    clearAdvanceTimer();
    setActiveStep(idx);
  };

  const handlePrevStep = () => {
    clearAdvanceTimer();
    shouldRestoreFocusRef.current = Boolean(
      questionnaireRef.current?.contains(document.activeElement)
    );
    setActiveStep((s) => Math.max(0, s - 1));
  };

  const handleNextStep = () => {
    clearAdvanceTimer();
    shouldRestoreFocusRef.current = Boolean(
      questionnaireRef.current?.contains(document.activeElement)
    );
    setActiveStep((s) => Math.min(QUESTIONS.length - 1, s + 1));
  };

  const handleStartEditing = () => {
    clearAdvanceTimer();
    if (result) {
      setAnswers(result.answers ?? {});
    }
    setActiveStep(0);
    setIsEditingAnswers(true);
  };

  const handleCancelEditing = () => {
    clearAdvanceTimer();
    if (result) {
      setAnswers(result.answers ?? {});
    }
    setIsEditingAnswers(false);
  };

  const handleRestart = () => {
    clearAdvanceTimer();
    setAnswers({});
    setActiveStep(0);
    setIsEditingAnswers(false);
    setPlanAdded(false);
    onReset();
  };

  const currentQuestion = QUESTIONS[activeStep] ?? QUESTIONS[0];
  const currentSelected = answers[currentQuestion.id];
  const currentAxisMeta = CLUSTER_META[currentQuestion.axis];
  const currentAxisColor = AXIS_DISPLAY[currentQuestion.axis].colorVar;

  const recommendedMethods = useMemo(() => {
    if (!result) return [];
    return result.recommendedIds
      .map((id) => METHODS.find((m) => m.id === id))
      .filter((m): m is RegulationMethod => Boolean(m));
  }, [result]);

  const overallAverage = useMemo(() => {
    if (!result) return 0;
    const vals = Object.values(result.scores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [result]);

  const isHighLoad = useMemo(() => {
    if (!result) return false;
    return (
      overallAverage >= 65 || Math.max(...Object.values(result.scores)) >= 75
    );
  }, [result, overallAverage]);

  const planMethods = recommendedMethods.slice(0, 2);
  const allPlanInTracker =
    planMethods.length > 0 &&
    (trackedMethodIds !== undefined
      ? planMethods.every((m) => trackedMethodIds.includes(m.id))
      : planAdded);

  const showQuestionnaire = !result || isEditingAnswers;

  useEffect(() => {
    if (showQuestionnaire) {
      setAnimatedAverage(0);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || overallAverage === 0) {
      setAnimatedAverage(overallAverage);
      return;
    }

    let rafId = 0;
    const duration = 500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.max(0, Math.min(1, elapsed / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedAverage(Math.round(overallAverage * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    setAnimatedAverage(0);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [showQuestionnaire, overallAverage]);

  useEffect(() => {
    if (!showQuestionnaire || !shouldRestoreFocusRef.current) return;
    shouldRestoreFocusRef.current = false;
    const container = questionnaireRef.current;
    if (
      container &&
      (!document.activeElement ||
        document.activeElement === document.body ||
        !container.contains(document.activeElement))
    ) {
      container.focus({ preventScroll: true });
    }
  }, [activeStep, showQuestionnaire]);

  const handleQuestionnaireKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    const isRadio =
      target?.tagName === 'INPUT' &&
      (target as HTMLInputElement).type === 'radio';

    if (
      target &&
      ((target.tagName === 'INPUT' && !isRadio) ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      handleSelectAnswer(currentQuestion.id, Number(e.key) - 1);
      return;
    }

    if (isRadio) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevStep();
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNextStep();
    }
  };

  return (
    <section
      id="diagnostics"
      className="no-print relative overflow-x-clip scroll-mt-24 bg-[#EFE8DC]"
    >
      <div className="max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-14 lg:py-20 space-y-8">
        <Reveal variant="clip-title">
          {/* Newspaper Double-Top Rule Header */}
          <div className="gazette-double-top pt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2.5 max-w-3xl">
              <span className="type-kicker text-[#523B7D]">
                Раздел 01 · Самооценка · 2 минуты
              </span>

              <h2 className="font-gazette-tall text-3xl sm:text-4xl lg:text-[48px] text-[#1C1629]">
                ЭКСПРЕСС-ДИАГНОСТИКА СОСТОЯНИЯ
              </h2>

              <p className="type-meta max-w-2xl">
                8 вопросов о последних двух неделях — чтобы подобрать практики под
                вашу зону нагрузки. Не является медицинским диагнозом.
              </p>
            </div>

            {result && !isEditingAnswers && (
              <div className="text-left sm:text-right shrink-0">
                <div className="type-kicker text-[#615875]">
                  Общий показатель
                </div>
                <div className="font-num text-3xl grad-text leading-none mt-1 tabular-nums">
                  НАГРУЗКА {animatedAverage}%
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* Main Editorial Sheet with Refined Outer Frame & Soft Spotlight */}
        <Reveal variant="slide-up" delayMs={80}>
          <div className="relative">
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
              className="pointer-events-none absolute -bottom-12 -right-10 w-80 h-80 rounded-full blur-3xl opacity-65"
              style={{
                background:
                  'radial-gradient(circle, rgba(61, 106, 148, 0.14) 0%, transparent 72%)',
              }}
            />

            {/* Single refined double-lined editorial frame instead of nested boxes */}
            <div className="relative z-10 rounded-[26px] bg-[#FCF9F3] border border-[#523B7D]/22 p-2 sm:p-2.5 shadow-[0_14px_40px_-14px_rgba(42,26,74,0.12)]">
              <div className="rounded-[20px] border border-[#523B7D]/10 bg-[#FCF9F3] p-5 sm:p-8 lg:p-10">
                {showQuestionnaire ? (
                  /* COMPACT 1-BLOCK STEP-BY-STEP QUESTIONNAIRE */
                  <div
                    ref={questionnaireRef}
                    tabIndex={-1}
                    onKeyDown={handleQuestionnaireKeyDown}
                    className="space-y-7 outline-none"
                  >
                    {/* Top Progress & Clickable 01..08 Step Rail */}
                    <div className="pb-5 border-b border-[#1C1629]/12 flex flex-wrap items-center justify-between gap-4">
                      <div
                        className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5"
                        role="group"
                        aria-label="Вопросы самооценки"
                      >
                        {QUESTIONS.map((q, idx) => {
                          const isCurrent = idx === activeStep;
                          const isDone = answers[q.id] !== undefined;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => handleStepClick(idx)}
                              aria-label={`Вопрос ${idx + 1}${isDone ? ' (отвечен)' : ''}`}
                              aria-current={isCurrent ? 'step' : undefined}
                              className={`h-8 min-w-[34px] px-2 rounded-lg font-gazette-mono text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                                isCurrent
                                  ? 'btn-violet shadow-[0_3px_12px_-2px_rgba(82,59,125,0.45)]'
                                  : isDone
                                  ? 'bg-[#ECE6F6] text-[#38255C] border border-[#CBBEE4] hover:bg-[#E1D7F2]'
                                  : 'bg-[#F7F2E7] text-[#6B6280] border border-[#1C1629]/10 hover:text-[#1C1629] hover:border-[#CBBEE4]'
                              }`}
                            >
                              {String(idx + 1).padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-full sm:w-56 flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full overflow-hidden bg-[#E5DDD0]">
                          <div
                            style={{
                              width: `${answeredCount > 0 ? Math.max(8, progressPct) : 0}%`,
                              background: 'var(--grad-signature)',
                            }}
                            className="h-full rounded-full transition-all duration-300"
                          />
                        </div>
                        <span className="font-gazette-mono text-[12px] font-semibold text-[#523B7D] min-w-[44px] text-right">
                          {answeredCount} / {QUESTIONS.length}
                        </span>
                      </div>
                    </div>

                    {/* Single Focused Question View (Fits Comfortably in 1 Block) */}
                    <fieldset
                      key={currentQuestion.id}
                      className="step-slide-in space-y-6 pl-4 sm:pl-6 border-l-[3px] transition-colors duration-200"
                      style={{
                        borderLeftColor:
                          currentSelected !== undefined
                            ? '#523B7D'
                            : currentAxisColor,
                      }}
                    >
                      <div className="space-y-2.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-num text-[26px] leading-none text-[#523B7D]">
                            {String(activeStep + 1).padStart(2, '0')}
                          </span>
                          <span className="h-3.5 w-px bg-[#1C1629]/15" aria-hidden="true" />
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              aria-hidden="true"
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                background: currentAxisColor,
                                boxShadow: AXIS_DOT_GLOW[currentQuestion.axis],
                              }}
                            />
                            <span
                              className="type-kicker"
                              style={{ color: currentAxisColor }}
                            >
                              {currentAxisMeta.shortLabel}
                            </span>
                          </span>
                          <span className="type-micro text-[#615875]">
                            · {currentQuestion.hint}
                          </span>
                        </div>

                        <legend className="font-editorial text-[20px] sm:text-[24px] leading-[1.35] text-[#1C1629] pt-1">
                          {currentQuestion.text}
                        </legend>
                      </div>

                      {/* Unified 5-Option Segmented Scale Track */}
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-2 rounded-2xl bg-[#EFE8DC]/80 border border-[#523B7D]/14">
                        {SCALE_OPTIONS.map((opt) => {
                          const isChecked = currentSelected === opt.value;
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center justify-center text-center rounded-xl px-3 py-3 text-[13.5px] sm:text-[14px] font-medium cursor-pointer min-h-[48px] leading-tight select-none transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#523B7D] has-[:focus-visible]:ring-offset-2 ${
                                isChecked
                                  ? 'btn-violet shadow-[0_6px_16px_-3px_rgba(82,59,125,0.45)]'
                                  : 'bg-[#FCF9F3]/60 text-[#312945] hover:bg-[#FCF9F3] hover:text-[#523B7D] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(28,22,41,0.08)]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={currentQuestion.id}
                                value={opt.value}
                                checked={isChecked}
                                onChange={() =>
                                  handleSelectAnswer(currentQuestion.id, opt.value)
                                }
                                className="sr-only"
                              />
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  aria-hidden="true"
                                  className={`hidden sm:inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-gazette-mono ${
                                    isChecked
                                      ? 'bg-white/15 text-[#FAF6EE]'
                                      : 'bg-[#1C1629]/6 text-[#615875]'
                                  }`}
                                >
                                  {opt.value + 1}
                                </span>
                                <span>{opt.label}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Clean Bottom Step Navigation */}
                    <div className="pt-5 border-t border-[#1C1629]/10 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={activeStep === 0}
                        onClick={handlePrevStep}
                        className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        <span>Предыдущий</span>
                      </button>

                      {isEditingAnswers && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditing}
                            className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold min-h-[40px] cursor-pointer"
                          >
                            <span>К результату</span>
                          </button>
                          <button
                            type="button"
                            disabled={answeredCount < QUESTIONS.length}
                            onClick={() => finalizeDiagnostic(answers)}
                            className="btn-violet inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold min-h-[40px] disabled:opacity-40 cursor-pointer"
                          >
                            <span>Обновить результат</span>
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={activeStep === QUESTIONS.length - 1}
                        onClick={handleNextStep}
                        className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>Следующий</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VERDICT SCREEN — Refined Editorial Framing */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* Left Column: Illuminated 4-Axis SVG Radar Chart + Percentage Bars */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="relative rounded-2xl p-5 sm:p-6 flex flex-col items-center overflow-hidden bg-gradient-to-b from-[#F7F2E7] to-[#EFE8DC]/60 border border-[#523B7D]/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-4 rounded-full blur-2xl opacity-80"
                          style={{
                            background:
                              'radial-gradient(circle, rgba(236, 230, 246, 0.92) 0%, rgba(228, 238, 247, 0.78) 52%, transparent 78%)',
                          }}
                        />
                        <div className="relative z-10 w-full flex items-center justify-between mb-3 pb-2.5 border-b border-[#523B7D]/12">
                          <span className="type-kicker text-[#615875]">
                            Профиль нагрузки (0–100%)
                          </span>
                          <span className="gazette-stamp text-[#523B7D] tabular-nums">
                            Нагрузка {animatedAverage}%
                          </span>
                        </div>

                        <div className="radar-pop relative z-10 w-full flex justify-center">
                          <FourAxisRadarChart scores={result.scores} />
                        </div>
                      </div>

                      {/* Horizontal Percentage Bars */}
                      <div className="space-y-3.5 px-1">
                        {(['body', 'mind', 'boundaries', 'resource'] as ClusterId[]).map(
                          (axis) => {
                            const val = result.scores[axis];
                            const meta = AXIS_DISPLAY[axis];
                            const isTop = result.topAxes.includes(axis) && val >= 25;
                            return (
                              <div key={axis} className="space-y-1.5">
                                <div className="flex items-center justify-between text-[14.5px]">
                                  <span className="font-semibold flex items-center gap-2 text-[#1C1629]">
                                    <span>{meta.title}</span>
                                    {isTop && (
                                      <span className="gazette-stamp text-[#523B7D]">
                                        приоритет
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-gazette-mono text-[13px] font-bold text-[#1C1629]">
                                    {val}%
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden bg-[#E5DDD0]">
                                  <div
                                    style={{
                                      width: `${Math.max(5, val)}%`,
                                      background: meta.colorVar,
                                    }}
                                    className="h-full rounded-full transition-all duration-500"
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Right Column: Verdict + 4 Clickable Editorial Cards + Actions */}
                    <div className="lg:col-span-7 space-y-6 lg:pl-6 lg:border-l lg:border-[#1C1629]/10">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 type-kicker text-[#523B7D]">
                          <Sparkles className="h-4 w-4 text-[#3D6A94]" aria-hidden="true" />
                          <span>Индивидуальный ориентир</span>
                        </div>

                        <h3 className="font-editorial text-2xl sm:text-3xl leading-tight text-[#1C1629]">
                          {overallAverage < 25
                            ? 'Профилактический фокус — '
                            : 'Приоритет внимания сейчас — '}
                          <span className="text-[#523B7D]">
                            {AXIS_DISPLAY[result.topAxes[0]].title.toLowerCase()}
                          </span>
                          {result.topAxes[1] && result.scores[result.topAxes[1]] >= 25 && (
                            <>
                              {', а также '}
                              <span className="text-[#3D6A94]">
                                {AXIS_DISPLAY[result.topAxes[1]].title.toLowerCase()}
                              </span>
                            </>
                          )}
                        </h3>

                        <div className="space-y-2.5 text-[15.5px] leading-relaxed text-[#362E47]">
                          {result.scores[result.topAxes[0]] >= 25 && (
                            <p>{AXIS_DISPLAY[result.topAxes[0]].advice}</p>
                          )}
                          {result.topAxes[1] && result.scores[result.topAxes[1]] >= 25 && (
                            <p>{AXIS_DISPLAY[result.topAxes[1]].advice}</p>
                          )}
                          {overallAverage < 25 && (
                            <p className="rounded-xl p-3.5 text-[14.5px] bg-[#ECE6F6]/70 border-l-[3px] border-l-[#523B7D] text-[#38255C]">
                              Ваш текущий профиль выглядит достаточно устойчивым. Сейчас
                              хорошо подходят короткие профилактические паузы для поддержания
                              баланса.
                            </p>
                          )}
                          {isHighLoad && (
                            <div
                              role="note"
                              className="rounded-xl p-4 text-[14.5px] leading-relaxed bg-[#F3E6EE]/85 border border-[#D9B8CE] border-l-[3px] border-l-[#7A4469] text-[#572B49] flex items-start gap-3"
                            >
                              <HeartHandshake
                                className="h-5 w-5 shrink-0 mt-0.5 text-[#7A4469]"
                                aria-hidden="true"
                              />
                              <p>
                                Уровень нагрузки сейчас заметно высок. При таком истощении
                                важно не оставаться с ним наедине: помимо коротких пауз стоит
                                обсудить пересмотр нагрузки с руководителем, обратиться за
                                супервизией, поддержкой коллеги или очной консультацией
                                специалиста.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4 Recommended Methods — Clean Left-Accent Editorial Cards */}
                      <div className="space-y-3 pt-1">
                        <p className="text-[14.5px] font-semibold text-[#1C1629]">
                          4 подобранные практики под ваш профиль (нажмите, чтобы открыть):
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {recommendedMethods.map((method, idx) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => onOpenMethod(method)}
                              style={{
                                animationDelay: `${idx * 65}ms`,
                                animationFillMode: 'both',
                              }}
                              className="pop-in group text-left p-4 rounded-xl cursor-pointer bg-[#F7F2E7]/85 border border-[#523B7D]/15 border-l-[3px] border-l-[#523B7D] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FCF9F3] hover:border-[#523B7D]/45 hover:shadow-[0_10px_24px_-10px_rgba(82,59,125,0.22)]"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="type-kicker text-[#523B7D]">
                                  №{String(method.id).padStart(2, '0')} ·{' '}
                                  {CLUSTER_META[method.cluster].shortLabel}
                                </span>
                                <span className="font-gazette-mono text-[11px] text-[#615875]">
                                  {method.durationLabel}
                                </span>
                              </div>
                              <p className="font-editorial text-[17px] leading-snug text-[#1C1629] group-hover:text-[#38255C] mb-1 transition-colors">
                                {method.shortTitle}
                              </p>
                              <p className="type-micro line-clamp-2 text-[#615875]">
                                {method.situationTag}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-[#1C1629]/10 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            disabled={allPlanInTracker}
                            onClick={() => {
                              onAddPlanToTracker(planMethods);
                              setPlanAdded(true);
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill min-h-[44px] ${
                              allPlanInTracker
                                ? 'cursor-default bg-[#ECE6F6] text-[#38255C] border border-[#CBBEE4]'
                                : 'btn-violet cursor-pointer'
                            }`}
                          >
                            {allPlanInTracker ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                <span>План добавлен в трекер</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                                <span>Добавить план в трекер</span>
                              </>
                            )}
                          </button>

                          {allPlanInTracker && onGoToTracker && (
                            <button
                              type="button"
                              onClick={onGoToTracker}
                              className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 type-pill min-h-[44px] cursor-pointer text-[#523B7D] border-[#CBBEE4]"
                            >
                              <span>Открыть трекер</span>
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={onShowRecommendedInCatalog}
                            className="btn-sky inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill min-h-[44px] cursor-pointer"
                          >
                            <span>Показать в каталоге</span>
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleStartEditing}
                            className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2 type-pill min-h-[40px] cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Изменить ответы</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRestart}
                            className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2 type-pill min-h-[40px] cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Пройти заново</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* Crisp Custom SVG 4-Axis Diamond / Radar Chart */
const FourAxisRadarChart: React.FC<{ scores: Record<ClusterId, number> }> = ({
  scores,
}) => {
  const cx = 160;
  const cy = 130;
  const maxR = 76;

  const toPoint = (axisIndex: number, pct: number) => {
    const r = (Math.max(8, pct) / 100) * maxR;
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    const angle = angles[axisIndex];
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const ringLevels = [25, 50, 75, 100];
  const values = [scores.body, scores.mind, scores.boundaries, scores.resource];
  const polyPoints = values
    .map((v, i) => {
      const p = toPoint(i, v);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 320 260"
      className="w-full max-w-[320px] h-auto"
      role="img"
      aria-label={`Диаграмма нагрузки: Тело ${scores.body}%, Мысли ${scores.mind}%, Границы ${scores.boundaries}%, Ресурс ${scores.resource}%`}
    >
      <defs>
        <filter id="radar-stroke-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#523B7D" floodOpacity="0.42" />
        </filter>
        <filter id="radar-point-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3D6A94" floodOpacity="0.58" />
        </filter>
      </defs>

      {ringLevels.map((lvl) => {
        const pts = [0, 1, 2, 3]
          .map((i) => {
            const p = toPoint(i, lvl);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={lvl}
            points={pts}
            fill="none"
            stroke="rgba(28, 22, 41, 0.16)"
            strokeWidth={lvl === 100 ? 1.4 : 1}
          />
        );
      })}

      <line
        x1={cx}
        y1={cy - maxR}
        x2={cx}
        y2={cy + maxR}
        stroke="rgba(28, 22, 41, 0.18)"
        strokeWidth={1}
      />
      <line
        x1={cx - maxR}
        y1={cy}
        x2={cx + maxR}
        y2={cy}
        stroke="rgba(28, 22, 41, 0.18)"
        strokeWidth={1}
      />

      <polygon
        points={polyPoints}
        fill="#523B7D"
        fillOpacity={0.18}
        stroke="#523B7D"
        strokeWidth={2.2}
        strokeLinejoin="round"
        filter="url(#radar-stroke-glow)"
      />

      {values.map((v, idx) => {
        const p = toPoint(idx, v);
        return (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={4.8}
            fill="#FCF9F3"
            stroke="#3D6A94"
            strokeWidth={2.4}
            filter="url(#radar-point-glow)"
          />
        );
      })}

      {/* Top: Тело */}
      <text
        x={cx}
        y={24}
        textAnchor="middle"
        fill="#1C1629"
        className="text-[12.5px] font-semibold"
      >
        Тело
      </text>
      <text
        x={cx}
        y={40}
        textAnchor="middle"
        fill="#615875"
        className="text-[11.5px] font-gazette-mono"
      >
        {scores.body}%
      </text>

      {/* Right: Мысли */}
      <text
        x={cx + maxR + 12}
        y={cy - 2}
        textAnchor="start"
        fill="#1C1629"
        className="text-[12.5px] font-semibold"
      >
        Мысли
      </text>
      <text
        x={cx + maxR + 12}
        y={cy + 14}
        textAnchor="start"
        fill="#615875"
        className="text-[11.5px] font-gazette-mono"
      >
        {scores.mind}%
      </text>

      {/* Bottom: Границы */}
      <text
        x={cx}
        y={228}
        textAnchor="middle"
        fill="#1C1629"
        className="text-[12.5px] font-semibold"
      >
        Границы
      </text>
      <text
        x={cx}
        y={244}
        textAnchor="middle"
        fill="#615875"
        className="text-[11.5px] font-gazette-mono"
      >
        {scores.boundaries}%
      </text>

      {/* Left: Ресурс */}
      <text
        x={cx - maxR - 12}
        y={cy - 2}
        textAnchor="end"
        fill="#1C1629"
        className="text-[12.5px] font-semibold"
      >
        Ресурс
      </text>
      <text
        x={cx - maxR - 12}
        y={cy + 14}
        textAnchor="end"
        fill="#615875"
        className="text-[11.5px] font-gazette-mono"
      >
        {scores.resource}%
      </text>
    </svg>
  );
};
