import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  HeartHandshake,
  Pause,
  Play,
  PlusCircle,
  RotateCcw,
  Trash2,
  Wind,
  X,
} from 'lucide-react';
import {
  CLUSTER_META,
  METHODS,
  RegulationMethod,
} from '../data/methods';

export type ModalState =
  | { type: 'closed' }
  | { type: 'sos-picker' }
  | { type: 'method'; method: RegulationMethod; fromSos?: boolean };

interface PracticeModalProps {
  modal: ModalState;
  worksheets: Record<number, Record<string, string>>;
  journals: Record<number, string>;
  trackedMethodIds?: number[];
  onClose: () => void;
  onSelectMethod: (method: RegulationMethod, fromSos?: boolean) => void;
  onBackToSosPicker: () => void;
  onSaveWorksheet: (methodId: number, values: Record<string, string>) => void;
  onClearWorksheet: (methodId: number) => void;
  onSaveJournal: (methodId: number, text: string) => void;
  onWipeJournal: (methodId: number) => void;
  onAddHabitFromModal: (trigger: string, action: string, methodId: number) => void;
  onSaveToEvening?: (items: string[]) => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  modal,
  worksheets,
  journals,
  trackedMethodIds,
  onClose,
  onSelectMethod,
  onBackToSosPicker,
  onSaveWorksheet,
  onClearWorksheet,
  onSaveJournal,
  onWipeJournal,
  onAddHabitFromModal,
  onSaveToEvening,
}) => {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isOpen = modal.type !== 'closed';
  const modalViewKey =
    modal.type === 'closed'
      ? 'closed'
      : modal.type === 'sos-picker'
      ? 'sos-picker'
      : `method-${modal.method.id}`;

  useEffect(() => {
    if (!isOpen) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && modalPanelRef.current) {
        const focusable = Array.from(
          modalPanelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusable.length === 0) {
          e.preventDefault();
          modalPanelRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (
            active === first ||
            active === modalPanelRef.current ||
            !modalPanelRef.current.contains(active)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else if (
          active === last ||
          !modalPanelRef.current.contains(active)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (opener && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  useEffect(() => {
    setEvidenceOpen(false);
    if (!isOpen) return;
    const raf = window.requestAnimationFrame(() => {
      modalPanelRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen, modalViewKey]);

  if (modal.type === 'closed') return null;

  const sosMethods = METHODS.filter((m) => m.quickSos);

  return (
    <div
      className="no-print modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs"
      style={{ background: 'var(--scrim)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalPanelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="modal-card-in relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl focus:outline-none"
        style={{
          background: '#FCF9F3',
          color: 'var(--ink)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Fixed Gradient Top Bar (Atelier Editorial Modal Language) */}
        <div
          className="shrink-0 flex items-start justify-between gap-4 px-4 sm:px-6 py-3.5 text-white"
          style={{ background: 'var(--grad-violet-deep)' }}
        >
          <div className="space-y-1 min-w-0">
            {modal.type === 'sos-picker' ? (
              <>
                <div className="inline-flex items-center gap-1.5 type-kicker text-[#CBE2F7]">
                  <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Быстрая пауза · 1–3 минуты</span>
                </div>
                <h2
                  id="practice-modal-title"
                  className="font-editorial text-2xl sm:text-[26px] leading-tight text-white"
                >
                  Выберите опору на ближайшие 2 минуты
                </h2>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {modal.fromSos && (
                    <button
                      type="button"
                      onClick={onBackToSosPicker}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[12px] font-semibold text-white mr-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Другая пауза</span>
                    </button>
                  )}
                  <span className="type-kicker text-[#CBE2F7]">
                    №{String(modal.method.id).padStart(2, '0')} ·{' '}
                    {CLUSTER_META[modal.method.cluster].label}
                  </span>
                  <span className="type-kicker text-white/85">
                    · {modal.method.durationLabel}
                  </span>
                </div>
                <h2
                  id="practice-modal-title"
                  className="font-editorial text-2xl sm:text-[26px] leading-tight text-white"
                >
                  {modal.method.title}
                </h2>
                <p className="text-[13px] text-white/85">{modal.method.author}</p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="shrink-0 inline-flex items-center justify-center rounded-full h-11 w-11 bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {modal.type === 'sos-picker' ? (
            <div className="space-y-3.5">
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                Короткие техники, которые можно сделать прямо в кабинете, на
                перемене или в ординаторской. Нажмите на подходящую:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {sosMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMethod(m, true)}
                    className="paper-card paper-card-hover text-left p-4 cursor-pointer space-y-2"
                    style={{
                      background: 'var(--bg-elev-1)',
                    }}
                  >
                    <div className="space-y-0.5">
                      <span className="block type-kicker" style={{ color: 'var(--violet)' }}>
                        №{String(m.id).padStart(2, '0')} · {m.durationLabel}
                      </span>
                      <span className="block type-micro" style={{ color: 'var(--ink-3)' }}>
                        {m.situationTag}
                      </span>
                    </div>
                    <p
                      className="font-editorial text-[18px]"
                      style={{ color: 'var(--ink)' }}
                    >
                      {m.shortTitle}
                    </p>
                    <p
                      className="text-[13.5px] leading-snug line-clamp-2"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {m.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Description */}
              <p className="text-[15.5px] leading-[1.6]" style={{ color: 'var(--ink)' }}>
                {modal.method.description}
              </p>

              {/* Safety Note Alert Box */}
              {modal.method.safetyNote && (
                <div
                  role="note"
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{
                    background: 'var(--plum-surface)',
                    border: '1px solid var(--plum-border)',
                    color: 'var(--plum-ink)',
                  }}
                >
                  <AlertCircle
                    className="h-5 w-5 shrink-0 mt-0.5"
                    style={{ color: 'var(--plum)' }}
                    aria-hidden="true"
                  />
                  <div className="space-y-0.5 text-[14px] leading-relaxed">
                    <p className="font-semibold">Важное правило безопасности</p>
                    <p>{modal.method.safetyNote}</p>
                  </div>
                </div>
              )}

              {/* Evidence Note Accordion */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'var(--sky-surface)',
                  border: '1px solid var(--sky-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEvidenceOpen((v) => !v)}
                  aria-expanded={evidenceOpen}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer transition-opacity hover:opacity-90"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <BookOpen
                      className="h-4 w-4"
                      style={{ color: 'var(--sky)' }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      Научная справка
                    </span>
                    <span
                      className={`gazette-stamp ${
                        modal.method.evidenceTier === 'rct_direct'
                          ? 'text-[#264A6D]'
                          : modal.method.evidenceTier === 'indirect_component'
                          ? 'text-[#523B7D]'
                          : 'text-[#7A4469]'
                      }`}
                    >
                      {modal.method.evidenceBadge}
                    </span>
                  </div>
                  {evidenceOpen ? (
                    <ChevronUp className="h-4 w-4" style={{ color: 'var(--ink-3)' }} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={{ color: 'var(--ink-3)' }} />
                  )}
                </button>
                {evidenceOpen && (
                  <div
                    className="px-4 pb-3.5 pt-2 text-[14px] leading-relaxed"
                    style={{
                      color: 'var(--sky-ink)',
                      borderTop: '1px solid var(--sky-border)',
                    }}
                  >
                    {modal.method.evidenceNote}
                  </div>
                )}
              </div>

              {/* Dedicated Interactive Widget */}
              <div className="pt-1">
                {modal.method.interactiveKind === 'breathing' && (
                  <BreathingWidget key={modal.method.id} />
                )}

                {modal.method.interactiveKind === 'timer' && (
                  <GuidedStepsTimerWidget
                    key={modal.method.id}
                    method={modal.method}
                  />
                )}

                {modal.method.interactiveKind === 'worksheet' && (
                  <WorksheetWidget
                    key={modal.method.id}
                    method={modal.method}
                    savedValues={worksheets[modal.method.id] ?? {}}
                    onChange={(vals) => onSaveWorksheet(modal.method.id, vals)}
                    onClear={() => onClearWorksheet(modal.method.id)}
                    onSaveToEvening={onSaveToEvening}
                  />
                )}

                {modal.method.interactiveKind === 'journal' && (
                  <JournalWidget
                    key={modal.method.id}
                    method={modal.method}
                    savedText={journals[modal.method.id] ?? ''}
                    onChange={(txt) => onSaveJournal(modal.method.id, txt)}
                    onWipe={() => onWipeJournal(modal.method.id)}
                  />
                )}

                {modal.method.interactiveKind === 'habit_builder' && (
                  <HabitBuilderWidget
                    key={modal.method.id}
                    method={modal.method}
                    isAlreadyTracked={
                      modal.method.id !== 8 &&
                      Boolean(trackedMethodIds?.includes(modal.method.id))
                    }
                    onSubmit={(trigger, action) =>
                      onAddHabitFromModal(trigger, action, modal.method.id)
                    }
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 1. BREATHING WIDGET                                                */
/* ------------------------------------------------------------------ */
type PaceKey = '4-4' | '4-6' | '5-5';
const PACES: Record<PaceKey, { label: string; inhale: number; exhale: number }> = {
  '4-4': { label: '4–4 ровно', inhale: 4, exhale: 4 },
  '4-6': { label: '4–6 удлинённый выдох', inhale: 4, exhale: 6 },
  '5-5': { label: '5–5 медленно', inhale: 5, exhale: 5 },
};

const BreathingWidget: React.FC = () => {
  const [pace, setPace] = useState<PaceKey>('4-6');
  const [totalDuration, setTotalDuration] = useState<120 | 180>(120);
  const [remainingMs, setRemainingMs] = useState(120 * 1000);
  const [cycleElapsedMs, setCycleElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);

  const lastTickRef = useRef<number | null>(null);
  const remainingRef = useRef(120 * 1000);
  const cycleElapsedRef = useRef(0);

  useEffect(() => {
    if (!running) {
      lastTickRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const last = lastTickRef.current ?? now;
      const delta = Math.max(0, now - last);
      lastTickRef.current = now;

      const nextRemaining = Math.max(0, remainingRef.current - delta);
      remainingRef.current = nextRemaining;
      cycleElapsedRef.current += delta;

      setRemainingMs(nextRemaining);
      setCycleElapsedMs(cycleElapsedRef.current);

      if (nextRemaining <= 0) {
        setRunning(false);
      }
    }, 50);
    return () => window.clearInterval(interval);
  }, [running]);

  const selectPace = (key: PaceKey) => {
    setPace(key);
    cycleElapsedRef.current = 0;
    setCycleElapsedMs(0);
    if (running) {
      lastTickRef.current = performance.now();
    }
  };

  const selectDuration = (sec: 120 | 180) => {
    setRunning(false);
    setTotalDuration(sec);
    remainingRef.current = sec * 1000;
    cycleElapsedRef.current = 0;
    setRemainingMs(sec * 1000);
    setCycleElapsedMs(0);
  };

  const reset = () => {
    setRunning(false);
    remainingRef.current = totalDuration * 1000;
    cycleElapsedRef.current = 0;
    setRemainingMs(totalDuration * 1000);
    setCycleElapsedMs(0);
  };

  const { inhale, exhale } = PACES[pace];
  const cycleMs = (inhale + exhale) * 1000;
  const posInCycle = cycleElapsedMs % cycleMs;
  const inhaleMs = inhale * 1000;
  const isInhale = posInCycle < inhaleMs;

  const phaseProgress = isInhale
    ? posInCycle / inhaleMs
    : (posInCycle - inhaleMs) / (exhale * 1000);
  const eased =
    0.5 - 0.5 * Math.cos(Math.PI * (isInhale ? phaseProgress : 1 - phaseProgress));
  const ringScale = running ? 0.62 + eased * 0.38 : 0.72;

  const secsLeft = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const ss = String(secsLeft % 60).padStart(2, '0');

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 space-y-3.5"
      style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--line-strong)',
      }}
    >
      {/* Pace & Duration Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PACES) as PaceKey[]).map((key) => {
            const active = pace === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectPace(key)}
                className="rounded-xl px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 min-h-[38px] cursor-pointer hover:-translate-y-[1px]"
                style={
                  active
                    ? {
                        background: 'var(--grad-violet-deep)',
                        color: 'var(--on-dark)',
                      }
                    : {
                        background: 'var(--bg-elev-2)',
                        color: 'var(--ink)',
                        border: '1px solid var(--line-strong)',
                      }
                }
              >
                {PACES[key].label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5">
          {([120, 180] as const).map((sec) => {
            const active = totalDuration === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => selectDuration(sec)}
                className="rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all duration-150 min-h-[38px] cursor-pointer hover:-translate-y-[1px]"
                style={
                  active
                    ? {
                        background: 'var(--grad-sky-deep)',
                        color: 'var(--on-dark)',
                      }
                    : {
                        background: 'var(--bg-elev-2)',
                        color: 'var(--ink)',
                        border: '1px solid var(--line-strong)',
                      }
                }
              >
                {sec / 60} мин
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated SVG Breathing Ring */}
      <div className="flex flex-col items-center justify-center py-1 space-y-3">
        <div className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-full">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-3 rounded-full blur-xl ambient-breathe"
            style={{
              background:
                'radial-gradient(circle, rgba(139,184,227,0.34) 0%, rgba(184,156,232,0.18) 55%, transparent 74%)',
            }}
          />
          <svg viewBox="0 0 200 200" className="relative z-10 w-full h-full">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="var(--sky-surface)"
              stroke="var(--sky-border)"
              strokeWidth="1.8"
            />
            <g transform={`translate(100 100) scale(${ringScale.toFixed(3)})`}>
              <circle
                cx="0"
                cy="0"
                r="82"
                fill="var(--sky)"
                fillOpacity={0.22}
                stroke="var(--sky)"
                strokeWidth="2.5"
              />
              <circle cx="0" cy="0" r="56" fill="var(--sky)" fillOpacity={0.16} />
            </g>
          </svg>

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 leading-tight">
            <span
              className="font-editorial text-[16px] sm:text-[18px] leading-tight max-w-[115px]"
              style={{ color: 'var(--ink)' }}
            >
              {remainingMs === 0
                ? 'Завершено'
                : !running && remainingMs < totalDuration * 1000 && remainingMs > 0
                ? 'Пауза'
                : !running
                ? 'Готовы начать'
                : isInhale
                ? 'Вдох...'
                : 'Плавный выдох...'}
            </span>
            <span
              className="font-gazette-mono text-[14px] font-bold mt-1"
              style={{ color: 'var(--sky)' }}
            >
              {mm}:{ss}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (remainingMs === 0) {
                remainingRef.current = totalDuration * 1000;
                cycleElapsedRef.current = 0;
                setRemainingMs(totalDuration * 1000);
                setCycleElapsedMs(0);
                setRunning(true);
                return;
              }
              setRunning((r) => !r);
            }}
            className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill min-h-[44px] cursor-pointer"
          >
            {running ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Пауза</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>
                  {remainingMs === 0
                    ? 'Повторить'
                    : remainingMs === totalDuration * 1000
                    ? 'Начать'
                    : 'Продолжить'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={reset}
            className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 type-pill min-h-[44px] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Сбросить</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 2. STEP-BY-STEP TIMER WIDGET                                       */
/* ------------------------------------------------------------------ */
const GuidedStepsTimerWidget: React.FC<{ method: RegulationMethod }> = ({
  method,
}) => {
  const steps = useMemo(
    () =>
      method.steps && method.steps.length > 0
        ? method.steps
        : [
            {
              title: 'Спокойная практика',
              instruction: method.description,
              seconds: 120,
            },
          ],
    [method]
  );

  const [stepIdx, setStepIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(steps[0].seconds);
  const [running, setRunning] = useState(false);

  const stepIdxRef = useRef(0);
  const secondsLeftRef = useRef(steps[0].seconds);

  const currentStep = steps[stepIdx];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (secondsLeftRef.current <= 1) {
        if (stepIdxRef.current < steps.length - 1) {
          const nextIdx = stepIdxRef.current + 1;
          stepIdxRef.current = nextIdx;
          secondsLeftRef.current = steps[nextIdx].seconds;
          setStepIdx(nextIdx);
          setSecondsLeft(steps[nextIdx].seconds);
        } else {
          secondsLeftRef.current = 0;
          setSecondsLeft(0);
          setRunning(false);
        }
      } else {
        secondsLeftRef.current -= 1;
        setSecondsLeft(secondsLeftRef.current);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, steps]);

  const goToStep = (idx: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    stepIdxRef.current = clamped;
    secondsLeftRef.current = steps[clamped].seconds;
    setStepIdx(clamped);
    setSecondsLeft(steps[clamped].seconds);
  };

  const reset = () => {
    setRunning(false);
    stepIdxRef.current = 0;
    secondsLeftRef.current = steps[0].seconds;
    setStepIdx(0);
    setSecondsLeft(steps[0].seconds);
  };

  const stepProgressPct = Math.round(
    ((currentStep.seconds - secondsLeft) / Math.max(1, currentStep.seconds)) * 100
  );
  const overallDone = stepIdx === steps.length - 1 && secondsLeft === 0;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 space-y-5"
      style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--line-strong)',
      }}
    >
      {/* Step Indicators */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="type-kicker" style={{ color: 'var(--ink-3)' }}>
            Шаг {stepIdx + 1} из {steps.length}
          </span>
          <span
            className="font-gazette-mono text-[14px] font-bold"
            style={{ color: 'var(--sky)' }}
          >
            {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
            {String(secondsLeft % 60).padStart(2, '0')}
          </span>
        </div>

        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
        >
          {steps.map((s, idx) => (
            <button
              key={`${s.title}-${idx}`}
              type="button"
              onClick={() => goToStep(idx)}
              aria-label={`Перейти к шагу ${idx + 1}: ${s.title}`}
              className="h-2.5 rounded-full overflow-hidden cursor-pointer"
              style={{ background: 'var(--bg-elev-3)' }}
            >
              <div
                style={{
                  width:
                    idx < stepIdx
                      ? '100%'
                      : idx === stepIdx
                      ? `${overallDone ? 100 : stepProgressPct}%`
                      : '0%',
                  background: 'var(--grad-sky-deep)',
                }}
                className="h-full transition-all duration-300"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Active Step Instruction */}
      <div
        className="rounded-2xl p-5 space-y-2"
        style={{
          background: 'var(--bg-elev-2)',
          border: '1px solid var(--line-strong)',
        }}
      >
        <h3 className="font-editorial text-xl" style={{ color: 'var(--ink)' }}>
          {overallDone ? 'Практика завершена' : currentStep.title}
        </h3>
        <p className="text-[15.5px] leading-[1.6]" style={{ color: 'var(--ink-2)' }}>
          {overallDone
            ? 'Сделайте спокойный вдох, поблагодарите себя за уделённое внимание и возвращайтесь к делам в своём темпе.'
            : currentStep.instruction}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={stepIdx === 0}
            onClick={() => goToStep(stepIdx - 1)}
            aria-label="Предыдущий шаг"
            className="btn-paper inline-flex items-center justify-center rounded-xl h-11 w-11 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (overallDone) {
                stepIdxRef.current = 0;
                secondsLeftRef.current = steps[0].seconds;
                setStepIdx(0);
                setSecondsLeft(steps[0].seconds);
                setRunning(true);
                return;
              }
              setRunning((r) => !r);
            }}
            className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill min-h-[44px] cursor-pointer"
          >
            {running ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Пауза</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>
                  {overallDone
                    ? 'Повторить'
                    : stepIdx > 0 || secondsLeft < currentStep.seconds
                    ? 'Продолжить'
                    : 'Запустить'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={stepIdx >= steps.length - 1}
            onClick={() => goToStep(stepIdx + 1)}
            aria-label="Следующий шаг"
            className="btn-paper inline-flex items-center justify-center rounded-xl h-11 w-11 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold underline underline-offset-4 cursor-pointer transition-opacity hover:opacity-80"
          style={{ color: 'var(--ink-2)' }}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Сначала</span>
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 3. WORKSHEET WIDGET                                                */
/* ------------------------------------------------------------------ */
const WorksheetWidget: React.FC<{
  method: RegulationMethod;
  savedValues: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClear: () => void;
  onSaveToEvening?: (items: string[]) => void;
}> = ({ method, savedValues, onChange, onClear, onSaveToEvening }) => {
  const fields = method.worksheetFields ?? [];
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const hasContent = fields.some((f) => Boolean(savedValues[f.id]?.trim()));

  const handleFieldChange = (fieldId: string, val: string) => {
    onChange({ ...savedValues, [fieldId]: val });
  };

  const handleSaveToEvening = () => {
    if (!onSaveToEvening) return;
    const filled = fields
      .map((f) => savedValues[f.id]?.trim() ?? '')
      .filter(Boolean);
    if (filled.length === 0) return;
    onSaveToEvening(filled);
  };

  const handleDownloadTxt = () => {
    if (!hasContent) return;
    const lines = [
      `Практика: ${method.title} (${method.author})`,
      `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
      '',
      ...fields.map((f) => `${f.label}\n${savedValues[f.id]?.trim() || '—'}\n`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practice-${method.id}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleClearClick = () => {
    if (!hasContent) return;
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
      confirmTimerRef.current = window.setTimeout(() => {
        setConfirmClear(false);
        confirmTimerRef.current = null;
      }, 4000);
      return;
    }
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setConfirmClear(false);
    onClear();
  };

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 space-y-4"
      style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--line-strong)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="type-kicker" style={{ color: 'var(--violet)' }}>
          Личный лист самонаблюдения · автосохранение в браузере
        </span>
      </div>

      <div className="space-y-3.5">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label
              htmlFor={`ws-${method.id}-${field.id}`}
              className="block text-[14.5px] font-semibold"
              style={{ color: 'var(--ink)' }}
            >
              {field.label}
            </label>
            <textarea
              id={`ws-${method.id}-${field.id}`}
              rows={2}
              value={savedValues[field.id] ?? ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-xl px-3.5 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-[var(--violet)]"
              style={{
                background: 'var(--bg-elev-2)',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink)',
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={!hasContent}
            onClick={handleDownloadTxt}
            className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill disabled:opacity-45 disabled:cursor-not-allowed min-h-[42px] cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Скачать лист (.txt)</span>
          </button>

          {method.id === 28 && onSaveToEvening && (
            <button
              type="button"
              disabled={!hasContent}
              onClick={handleSaveToEvening}
              className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill disabled:opacity-45 disabled:cursor-not-allowed min-h-[42px] cursor-pointer"
            >
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              <span>Сохранить в «Вечерний итог»</span>
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={!hasContent}
          onClick={handleClearClick}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 type-pill min-h-[42px] cursor-pointer transition-all hover:-translate-y-[1px] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{
            background: 'var(--plum-surface)',
            border: '1px solid var(--plum-border)',
            color: 'var(--plum-ink)',
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span>{confirmClear && hasContent ? 'Подтвердить очистку?' : 'Очистить поля'}</span>
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 4. JOURNAL WIDGET (#17 Expressive Writing)                         */
/* ------------------------------------------------------------------ */
const JournalWidget: React.FC<{
  method: RegulationMethod;
  savedText: string;
  onChange: (text: string) => void;
  onWipe: () => void;
}> = ({ method, savedText, onChange, onWipe }) => {
  const [minutes, setMinutes] = useState<5 | 10 | 15>(10);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const secondsLeftRef = useRef(10 * 60);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      if (secondsLeftRef.current <= 1) {
        secondsLeftRef.current = 0;
        setSecondsLeft(0);
        setRunning(false);
      } else {
        secondsLeftRef.current -= 1;
        setSecondsLeft(secondsLeftRef.current);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const pickMinutes = (m: 5 | 10 | 15) => {
    setRunning(false);
    setMinutes(m);
    secondsLeftRef.current = m * 60;
    setSecondsLeft(m * 60);
  };

  const handleToggleTimer = () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (secondsLeft === 0) {
      secondsLeftRef.current = minutes * 60;
      setSecondsLeft(minutes * 60);
    }
    setRunning(true);
  };

  const wordCount = useMemo(() => {
    const trimmed = savedText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [savedText]);

  const hasText = Boolean(savedText.trim());

  const handleDownload = () => {
    if (!hasText) return;
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`;
    const content = `${method.title}\n${now.toLocaleDateString('ru-RU')}\n\n${savedText}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expressive-writing-${localDate}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleWipeClick = () => {
    if (!hasText) return;
    if (!confirmWipe) {
      setConfirmWipe(true);
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
      confirmTimerRef.current = window.setTimeout(() => {
        setConfirmWipe(false);
        confirmTimerRef.current = null;
      }, 4000);
      return;
    }
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setConfirmWipe(false);
    onWipe();
  };

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 space-y-3.5"
      style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--line-strong)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {([5, 10, 15] as const).map((m) => {
            const active = minutes === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => pickMinutes(m)}
                className="rounded-xl px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 min-h-[38px] cursor-pointer hover:-translate-y-[1px]"
                style={
                  active
                    ? {
                        background: 'var(--grad-violet-deep)',
                        color: 'var(--on-dark)',
                      }
                    : {
                        background: 'var(--bg-elev-2)',
                        color: 'var(--ink)',
                        border: '1px solid var(--line-strong)',
                      }
                }
              >
                {m} мин
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="font-gazette-mono text-[14px] font-bold"
            style={{ color: 'var(--sky)' }}
          >
            {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
            {String(secondsLeft % 60).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={handleToggleTimer}
            className="btn-paper inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[13px] font-semibold min-h-[38px] cursor-pointer"
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>
              {running ? 'Пауза' : secondsLeft === 0 ? 'Повторить таймер' : 'Старт таймера'}
            </span>
          </button>
        </div>
      </div>

      {secondsLeft === 0 && (
        <div
          role="status"
          className="rounded-xl px-3.5 py-2.5 text-[13.5px] leading-snug"
          style={{
            background: 'var(--sky-surface)',
            border: '1px solid var(--sky-border)',
            color: 'var(--sky-ink)',
          }}
        >
          Время вышло. Сделайте спокойный выдох и почувствуйте опору стоп на полу.
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[13.5px] leading-snug" style={{ color: 'var(--ink-2)' }}>
          Пишите свободно, не думая о стиле: что сегодня забрало больше всего сил?
        </p>
        <textarea
          rows={4}
          value={savedText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Никто, кроме вас, не увидит написанное."
          aria-label="Поле для экспрессивного письма"
          className="w-full rounded-xl p-4 text-[15.5px] leading-[1.6] focus:outline-none focus:ring-2 focus:ring-[var(--violet)]"
          style={{
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--line-strong)',
            color: 'var(--ink)',
          }}
        />
        <div
          className="flex items-center justify-between type-kicker text-[10.5px]"
          style={{ color: 'var(--ink-3)' }}
        >
          <span>Слов: {wordCount}</span>
          <span>Хранится только на вашем устройстве</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={!hasText}
          onClick={handleDownload}
          className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill disabled:opacity-45 disabled:cursor-not-allowed min-h-[42px] cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Скачать текст (.txt)</span>
        </button>

        <button
          type="button"
          disabled={!hasText}
          onClick={handleWipeClick}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 type-pill transition-all duration-150 hover:-translate-y-[1px] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0 min-h-[42px] cursor-pointer"
          style={{
            background: 'var(--plum-surface)',
            border: '1px solid var(--plum-border)',
            color: 'var(--plum-ink)',
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span>{confirmWipe && hasText ? 'Подтвердить удаление?' : 'Удалить без следа'}</span>
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 5. HABIT BUILDER WIDGET (#8, #9, #12, #30)                         */
/* ------------------------------------------------------------------ */
const HabitBuilderWidget: React.FC<{
  method: RegulationMethod;
  isAlreadyTracked?: boolean;
  onSubmit: (trigger: string, action: string) => void;
}> = ({ method, isAlreadyTracked = false, onSubmit }) => {
  const [trigger, setTrigger] = useState(
    method.defaultTrigger ?? 'В конце рабочего дня или в короткой паузе'
  );
  const [action, setAction] = useState(
    method.defaultAction ?? `Выполняю практику «${method.shortTitle}»`
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || isAlreadyTracked || !trigger.trim() || !action.trim()) return;
    setSubmitted(true);
    onSubmit(trigger.trim(), action.trim());
  };

  const isDisabled =
    submitted || isAlreadyTracked || !trigger.trim() || !action.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 sm:p-6 space-y-4"
      style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--line-strong)',
      }}
    >
      <p className="text-[14.5px]" style={{ color: 'var(--ink-2)' }}>
        Настройте правило «если — то» под свой рабочий день и добавьте его в
        недельный трекер:
      </p>

      {isAlreadyTracked && (
        <div
          role="status"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold"
          style={{
            background: 'var(--sky-surface)',
            border: '1px solid var(--sky-border)',
            color: 'var(--sky-ink)',
          }}
        >
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Эта практика уже есть в вашем трекере</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1">
          <label
            htmlFor="modal-habit-trigger"
            className="block text-[14px] font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            Если (ситуация-сигнал)
          </label>
          <input
            id="modal-habit-trigger"
            type="text"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-[var(--violet)] min-h-[44px]"
            style={{
              background: 'var(--bg-elev-2)',
              border: '1px solid var(--line-strong)',
              color: 'var(--ink)',
            }}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="modal-habit-action"
            className="block text-[14px] font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            То (короткое действие)
          </label>
          <input
            id="modal-habit-action"
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-[var(--violet)] min-h-[44px]"
            style={{
              background: 'var(--bg-elev-2)',
              border: '1px solid var(--line-strong)',
              color: 'var(--ink)',
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill disabled:opacity-45 disabled:cursor-not-allowed min-h-[44px] cursor-pointer"
      >
        {submitted || isAlreadyTracked ? (
          <>
            <Check className="h-4 w-4" />
            <span>{submitted ? 'Добавлено в трекер' : 'Уже в трекере'}</span>
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4" />
            <span>Добавить в мой трекер</span>
          </>
        )}
      </button>
    </form>
  );
};
