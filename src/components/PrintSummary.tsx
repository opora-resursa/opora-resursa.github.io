import React, { useEffect, useRef } from 'react';
import { Check, Eye, EyeOff, HeartHandshake, Printer, X } from 'lucide-react';
import { ClusterId, CLUSTER_META, METHODS } from '../data/methods';
import { AppState } from '../types/app';
import { DAY_LABELS, formatEntryDateLabel } from '../utils/storage';

export interface PrintOptions {
  includeDiagnostic: boolean;
  includeTracker: boolean;
  includeSosCard: boolean;
  includeEvening: boolean;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  includeDiagnostic: true,
  includeTracker: true,
  includeSosCard: true,
  includeEvening: true,
};

const AXIS_ORDER: ClusterId[] = ['body', 'mind', 'boundaries', 'resource'];

const AXIS_NAMES: Record<ClusterId, string> = {
  body: 'Телесное напряжение',
  mind: 'Мысли и эмоции',
  boundaries: 'Границы и отдых',
  resource: 'Дефицит ресурса',
};

const AXIS_SHORT: Record<ClusterId, string> = {
  body: 'Тело',
  mind: 'Мысли',
  boundaries: 'Границы',
  resource: 'Ресурс',
};

const AXIS_BAR_COLORS: Record<ClusterId, string> = {
  body: '#3D6A94',
  mind: '#523B7D',
  boundaries: '#7A4469',
  resource: '#8C7760',
};

const AXIS_ADVICE: Record<ClusterId, string> = {
  body: 'Тело дольше удерживает режим мобилизации — сработают короткие соматические сбросы напряжения и плавное дыхание в перерывах.',
  mind: 'Основная трата сил идёт через прокручивание ситуаций и самокритику — помогут переключение внимания, самосострадание и структурирование мыслей.',
  boundaries:
    'Граница между сменой и личным временем размывается — опорой станут микроперерывы, ритуал завершения дня и планы «если — то».',
  resource:
    'Фоновый запас сил снижен — важно бережно возвращать внимание к простым источникам тепла, поддержки и смысла.',
};

const SOS_CARDS = [
  {
    title: '1. Дыхание 4–6 (№03 · 2 мин)',
    text: 'Спокойный вдох на 4 счёта и плавный выдох на 6 счётов без задержек и напряжения.',
  },
  {
    title: '2. Самообъятие (№13 · 2 мин)',
    text: 'Ладонь под противоположную мышку, вторая на плечо — почувствуйте физические границы тела и тепло рук.',
  },
  {
    title: '3. Заземление (№19 · 1–2 мин)',
    text: 'Обе стопы плоско на пол, ощутите опору спинки кресла и спокойно назовите 3 нейтральных предмета вокруг.',
  },
];

function getFirstSentence(text: string): string {
  const clean = text.trim();
  const dotIdx = clean.indexOf('.');
  if (dotIdx === -1) return clean;
  return clean.slice(0, dotIdx + 1);
}

/* Crisp Vector 4-Axis Diamond Radar Chart for Screen Preview & A4 PDF */
const PrintRadarChart: React.FC<{ scores: Record<ClusterId, number> }> = ({
  scores,
}) => {
  const cx = 140;
  const cy = 115;
  const maxR = 64;

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
      viewBox="0 0 280 230"
      className="w-full max-w-[260px] h-auto mx-auto"
      role="img"
      aria-label={`Диаграмма нагрузки: Тело ${scores.body}%, Мысли ${scores.mind}%, Границы ${scores.boundaries}%, Ресурс ${scores.resource}%`}
    >
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
            strokeWidth={lvl === 100 ? 1.25 : 0.9}
          />
        );
      })}

      <line
        x1={cx}
        y1={cy - maxR}
        x2={cx}
        y2={cy + maxR}
        stroke="rgba(28, 22, 41, 0.18)"
        strokeWidth={0.9}
      />
      <line
        x1={cx - maxR}
        y1={cy}
        x2={cx + maxR}
        y2={cy}
        stroke="rgba(28, 22, 41, 0.18)"
        strokeWidth={0.9}
      />

      <polygon
        points={polyPoints}
        fill="#523B7D"
        fillOpacity={0.18}
        stroke="#523B7D"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {values.map((v, idx) => {
        const p = toPoint(idx, v);
        return (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={4.2}
            fill="#FCF9F3"
            stroke="#3D6A94"
            strokeWidth={2.2}
          />
        );
      })}

      {/* Top: Тело */}
      <text
        x={cx}
        y={22}
        textAnchor="middle"
        fill="#1C1629"
        fontSize="11.5"
        fontWeight="600"
      >
        {AXIS_SHORT.body}
      </text>
      <text
        x={cx}
        y={36}
        textAnchor="middle"
        fill="#523B7D"
        fontSize="10.5"
        fontWeight="700"
        className="font-gazette-mono"
      >
        {scores.body}%
      </text>

      {/* Right: Мысли */}
      <text
        x={cx + maxR + 10}
        y={cy - 2}
        textAnchor="start"
        fill="#1C1629"
        fontSize="11.5"
        fontWeight="600"
      >
        {AXIS_SHORT.mind}
      </text>
      <text
        x={cx + maxR + 10}
        y={cy + 12}
        textAnchor="start"
        fill="#523B7D"
        fontSize="10.5"
        fontWeight="700"
        className="font-gazette-mono"
      >
        {scores.mind}%
      </text>

      {/* Bottom: Границы */}
      <text
        x={cx}
        y={199}
        textAnchor="middle"
        fill="#1C1629"
        fontSize="11.5"
        fontWeight="600"
      >
        {AXIS_SHORT.boundaries}
      </text>
      <text
        x={cx}
        y={213}
        textAnchor="middle"
        fill="#523B7D"
        fontSize="10.5"
        fontWeight="700"
        className="font-gazette-mono"
      >
        {scores.boundaries}%
      </text>

      {/* Left: Ресурс */}
      <text
        x={cx - maxR - 10}
        y={cy - 2}
        textAnchor="end"
        fill="#1C1629"
        fontSize="11.5"
        fontWeight="600"
      >
        {AXIS_SHORT.resource}
      </text>
      <text
        x={cx - maxR - 10}
        y={cy + 12}
        textAnchor="end"
        fill="#523B7D"
        fontSize="10.5"
        fontWeight="700"
        className="font-gazette-mono"
      >
        {scores.resource}%
      </text>
    </svg>
  );
};

export const PrintSheetContent: React.FC<{
  state: AppState;
  options: PrintOptions;
}> = ({ state, options }) => {
  const localDate = new Date().toLocaleDateString('ru-RU');

  const recommended = (state.diagnostic?.recommendedIds ?? [])
    .map((id) => METHODS.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const overallAverage = state.diagnostic
    ? Math.round(
        Object.values(state.diagnostic.scores).reduce((sum, val) => sum + val, 0) /
          4
      )
    : 0;

  const isHighLoad = state.diagnostic
    ? overallAverage >= 65 ||
      Object.values(state.diagnostic.scores).some((val) => val >= 75)
    : false;

  const activeAdviceAxes = state.diagnostic
    ? state.diagnostic.topAxes.filter(
        (axis) => state.diagnostic!.scores[axis] >= 25
      )
    : [];

  const markedResources = state.resourceLevels.filter(
    (v): v is number => v !== null
  );
  const avgResource =
    markedResources.length > 0
      ? (
          markedResources.reduce((sum, v) => sum + v, 0) /
          markedResources.length
        )
          .toFixed(1)
          .replace('.', ',')
      : null;

  const hasEveningEntries =
    options.includeEvening && state.threeGoodThings.length > 0;
  const hasAnySection =
    options.includeDiagnostic ||
    options.includeTracker ||
    options.includeSosCard ||
    hasEveningEntries;

  return (
    <article className="text-[#1C1629] space-y-4 text-[12px] leading-[1.42]">
      {/* 1. Editorial Masthead Header */}
      <header className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] font-gazette-mono uppercase tracking-[0.09em] text-[#615875]">
          <span>№ 01 · ЛИЧНАЯ ПАМЯТКА САМОРЕГУЛЯЦИИ</span>
          <span className="font-semibold text-[#38255C]">Опора ресурса</span>
          <span>opora-resursa.github.io · {localDate}</span>
        </div>

        <div className="relative border-t-2 border-[#1C1629] pt-3 pb-2.5 border-b border-b-[#1C1629]/20 flex flex-col sm:flex-row print:flex-row sm:items-end print:items-end justify-between gap-3">
          <span
            aria-hidden="true"
            className="absolute top-[3px] left-0 right-0 h-px bg-[#1C1629]/45"
          />
          <div>
            <h1 className="font-gazette-tall text-[26px] sm:text-[30px] print:text-[28px] leading-[0.98] text-[#1F192E] tracking-tight">
              ЛИЧНАЯ ПАМЯТКА ВОССТАНОВЛЕНИЯ
            </h1>
            <p className="font-editorial-italic text-[13px] text-[#362E47] mt-1">
              «Индивидуальный маршрут саморегуляции для рабочего дня»
            </p>
          </div>

          {state.diagnostic ? (
            <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#ECE6F6] border border-[#CBBEE4] px-3 py-1.5 text-[#38255C]">
              <span className="font-gazette-mono text-[10.5px] font-bold uppercase tracking-wider">
                Общая нагрузка: {overallAverage}%
              </span>
            </div>
          ) : (
            <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#E4EEF7] border border-[#B4CDE4] px-3 py-1.5 text-[#264A6D]">
              <span className="font-gazette-mono text-[10.5px] font-bold uppercase tracking-wider">
                Стартовый план · 30 методик
              </span>
            </div>
          )}
        </div>
      </header>

      {!hasAnySection && (
        <div className="rounded-xl bg-[#FAF7F1] border border-[#1C1629]/15 p-5 text-center text-[12.5px] text-[#615875]">
          Ни один раздел не выбран — отметьте нужные блоки в панели фильтрации
          выше, чтобы сформировать печатную памятку.
        </div>
      )}

      {/* 2. Block 1 · Профиль нагрузки и подобранные практики */}
      {options.includeDiagnostic && (
        <section className="space-y-2.5 print-card">
          <div className="flex items-baseline justify-between border-b border-[#1C1629]/20 pb-1">
            <h2 className="font-editorial text-[15px] text-[#1F192E]">
              1. Профиль нагрузки и подобранные практики
            </h2>
            {state.diagnostic && (
              <span className="font-gazette-mono text-[9.5px] uppercase tracking-wider text-[#615875]">
                Скрининг 4 осей
              </span>
            )}
          </div>

          {state.diagnostic ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-4 items-start">
              {/* Left (5 cols): Radar Chart + 4 Bars */}
              <div className="sm:col-span-5 print:col-span-5 space-y-2.5">
                <div className="rounded-xl bg-[#FAF7F1] border border-[#1C1629]/15 p-2.5">
                  <PrintRadarChart scores={state.diagnostic.scores} />
                </div>

                <div className="space-y-1.5 px-0.5">
                  {AXIS_ORDER.map((axis) => {
                    const val = state.diagnostic!.scores[axis];
                    return (
                      <div key={axis} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-[#1C1629]">
                            {AXIS_NAMES[axis]}
                          </span>
                          <span className="font-gazette-mono font-bold text-[#362E47]">
                            {val}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#EFE8DC] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(4, val)}%`,
                              backgroundColor: AXIS_BAR_COLORS[axis],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right (7 cols): Verdict + High-Load Note + 2x2 Practices */}
              <div className="sm:col-span-7 print:col-span-7 space-y-2.5">
                <div className="space-y-1">
                  <h3 className="font-editorial text-[14px] text-[#1C1629]">
                    {overallAverage < 25
                      ? 'Профилактический фокус'
                      : 'Приоритет внимания'}
                    {activeAdviceAxes.length > 0 && (
                      <span className="text-[#523B7D]">
                        {' '}
                        —{' '}
                        {activeAdviceAxes
                          .map((ax) => AXIS_NAMES[ax].toLowerCase())
                          .join(' и ')}
                      </span>
                    )}
                  </h3>

                  {activeAdviceAxes.length > 0 ? (
                    <div className="space-y-1 text-[11.5px] leading-[1.42] text-[#362E47]">
                      {activeAdviceAxes.map((axis) => (
                        <p key={axis}>{AXIS_ADVICE[axis]}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-[#ECE6F6]/70 border-l-[3px] border-l-[#523B7D] px-2.5 py-1.5 text-[11.5px] text-[#38255C]">
                      Текущий профиль выглядит устойчивым — сейчас хорошо
                      подходят короткие профилактические паузы для поддержания
                      баланса.
                    </p>
                  )}
                </div>

                {isHighLoad && (
                  <div className="rounded-lg bg-[#F3E6EE] border border-[#D9B8CE] border-l-[3px] border-l-[#7A4469] px-2.5 py-2 text-[11px] leading-[1.38] text-[#572B49] flex items-start gap-2">
                    <HeartHandshake
                      className="w-4 h-4 shrink-0 mt-0.5 text-[#7A4469]"
                      aria-hidden="true"
                    />
                    <p>
                      Нагрузка сейчас высока: помимо коротких пауз важно обсудить
                      пересмотр объёма задач с руководителем, обратиться за
                      супервизией или очной поддержкой специалиста.
                    </p>
                  </div>
                )}

                {recommended.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2">
                    {recommended.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="print-card rounded-lg bg-[#FAF7F1] border border-[#1C1629]/12 overflow-hidden flex flex-col"
                      >
                        <div
                          className="h-[2px] w-full shrink-0"
                          style={{ background: CLUSTER_META[m.cluster].accent }}
                        />
                        <div className="p-2.5 space-y-1">
                          <div className="flex items-center justify-between gap-1.5 text-[9.5px] font-gazette-mono text-[#615875]">
                            <span className="font-semibold text-[#523B7D]">
                              №{String(m.id).padStart(2, '0')} · {m.durationLabel}
                            </span>
                            <span>{CLUSTER_META[m.cluster].shortLabel}</span>
                          </div>
                          <p className="font-editorial text-[13px] leading-snug text-[#1C1629]">
                            {m.shortTitle}
                          </p>
                          <p className="text-[10.5px] leading-[1.35] text-[#362E47] line-clamp-2">
                            <span className="font-semibold text-[#1C1629]">
                              {m.situationTag}:
                            </span>{' '}
                            {getFirstSentence(m.description)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#FAF7F1] border border-[#1C1629]/15 px-3.5 py-3 text-[12px] text-[#362E47]">
              Самооценка состояния ещё не пройдена — вы можете пройти 2-минутный
              скрининг на{' '}
              <span className="font-semibold text-[#523B7D]">
                opora-resursa.github.io
              </span>
              , чтобы получить персональную диаграмму и подборку из 4 практик.
            </div>
          )}
        </section>
      )}

      {/* 3. Block 2 · Правила «если — то» и динамика сил (Метод №8) */}
      {options.includeTracker && (
        <section className="space-y-2.5 print-card">
          <div className="flex items-baseline justify-between border-b border-[#1C1629]/20 pb-1">
            <h2 className="font-editorial text-[15px] text-[#1F192E]">
              2. Правила «если — то» и динамика сил (Метод №8)
            </h2>
            <span className="font-gazette-mono text-[9.5px] uppercase tracking-wider text-[#615875]">
              Недельный лист · можно отмечать ручкой
            </span>
          </div>

          <div className="rounded-xl border border-[#1C1629]/15 overflow-hidden bg-white">
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-[#F7F2E7] border-b border-[#1C1629]/15 text-left">
                  <th className="py-1.5 px-3 font-semibold text-[#1C1629]">
                    Правило (триггер → короткое действие)
                  </th>
                  {DAY_LABELS.map((d) => (
                    <th
                      key={d}
                      className="py-1.5 px-1 text-center w-8 font-gazette-mono text-[10px] font-semibold text-[#362E47]"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.habits.length > 0 ? (
                  state.habits.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-[#1C1629]/10 last:border-b-0"
                    >
                      <td className="py-2 px-3 align-middle">
                        <div>
                          <span className="font-semibold text-[#523B7D]">
                            Если:
                          </span>{' '}
                          <span className="text-[#1C1629]">{h.trigger}</span>
                        </div>
                        <div className="mt-0.5">
                          <span className="font-semibold text-[#3D6A94]">
                            То:
                          </span>{' '}
                          <span className="text-[#362E47]">{h.action}</span>
                        </div>
                      </td>
                      {h.checks.map((checked, idx) => (
                        <td key={idx} className="py-2 px-1 text-center align-middle">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                              checked
                                ? 'bg-[#523B7D] text-white border border-[#523B7D]'
                                : 'bg-white border border-[#1C1629]/25'
                            }`}
                          >
                            {checked && (
                              <Check
                                className="w-3 h-3 stroke-[2.75]"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  [0, 1].map((rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-[#1C1629]/10 last:border-b-0"
                    >
                      <td className="py-2.5 px-3 text-[#615875] space-y-1">
                        <div>
                          <span className="font-semibold text-[#523B7D]">
                            Если:
                          </span>{' '}
                          <span className="inline-block w-48 border-b border-dashed border-[#1C1629]/25" />
                        </div>
                        <div>
                          <span className="font-semibold text-[#3D6A94]">
                            То:
                          </span>{' '}
                          <span className="inline-block w-52 border-b border-dashed border-[#1C1629]/25" />
                        </div>
                      </td>
                      {DAY_LABELS.map((d) => (
                        <td key={d} className="py-2 px-1 text-center align-middle">
                          <span className="inline-flex w-5 h-5 rounded-full bg-white border border-[#1C1629]/25" />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 7-Day Energy Strip (Пн–Вс) */}
          <div className="rounded-xl bg-[#FAF7F1] border border-[#1C1629]/15 px-3 py-2.5 space-y-2 print-card">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-[#1C1629]">
                Динамика уровня сил за неделю (1–10)
              </span>
              <span className="font-gazette-mono text-[10.5px] font-semibold text-[#38255C]">
                Средний уровень сил: {avgResource ?? '___'} / 10
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {DAY_LABELS.map((day, idx) => {
                const lvl = state.resourceLevels[idx];
                const barHeightPct =
                  lvl !== null ? Math.max(12, Math.min(100, lvl * 10)) : 0;
                return (
                  <div
                    key={day}
                    className="rounded-lg bg-white border border-[#1C1629]/12 px-1.5 py-1.5 flex flex-col items-center gap-1"
                  >
                    <span className="font-gazette-mono text-[9.5px] text-[#615875]">
                      {day}
                    </span>
                    <div className="w-full h-8 rounded bg-[#EFE8DC]/75 flex items-end justify-center p-0.5">
                      {lvl !== null ? (
                        <div
                          className="w-full rounded-sm"
                          style={{
                            height: `${barHeightPct}%`,
                            backgroundColor:
                              lvl >= 7 ? '#3D6A94' : lvl >= 4 ? '#523B7D' : '#7A4469',
                          }}
                        />
                      ) : null}
                    </div>
                    <span className="font-gazette-mono text-[10.5px] font-bold text-[#1C1629]">
                      {lvl !== null ? lvl : '___'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. Block 3 · Карманная аптечка на рабочий стол (2 минуты) */}
      {options.includeSosCard && (
        <section className="print-card rounded-xl bg-[#FAF7F1] border border-[#3D6A94]/30 border-t-2 border-t-[#3D6A94] p-3.5 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-editorial text-[14.5px] text-[#264A6D]">
              3. Карманная аптечка на рабочий стол (2 минуты)
            </h2>
            <span className="font-gazette-mono text-[9.5px] uppercase tracking-wider text-[#3D6A94]">
              Быстрая опора в перерыве
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2.5">
            {SOS_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-lg bg-white/90 border border-[#3D6A94]/20 p-2.5 space-y-1"
              >
                <p className="text-[11px] font-bold text-[#1F192E]">
                  {card.title}
                </p>
                <p className="text-[10.5px] leading-[1.38] text-[#362E47]">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Block 4 · Вечерний итог (Метод №28) */}
      {hasEveningEntries && (
        <section className="space-y-2 print-card">
          <div className="flex items-baseline justify-between gap-2 border-b border-[#1C1629]/20 pb-1">
            <h2 className="font-editorial text-[15px] text-[#1F192E]">
              4. Вечерний итог (Метод №28)
            </h2>
            {state.threeGoodThings.length > 4 && (
              <span className="font-gazette-mono text-[9.5px] text-[#615875]">
                Показаны 4 из {state.threeGoodThings.length} записей
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5">
            {state.threeGoodThings.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="print-card rounded-lg bg-[#FAF7F1] border border-[#1C1629]/12 p-2.5 space-y-1"
              >
                <p className="font-gazette-mono text-[10px] font-bold uppercase tracking-wider text-[#523B7D]">
                  {formatEntryDateLabel(entry)}
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#362E47]">
                  {entry.items.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Editorial Print Footer */}
      <footer className="border-t border-[#1C1629]/20 pt-2.5 mt-4 flex flex-wrap justify-between gap-2 text-[10px] text-[#615875]">
        <span>
          Опора ресурса · https://opora-resursa.github.io/ · Сформировано локально
          в вашем браузере
        </span>
        <span>
          Не заменяет очную медицинскую или психотерапевтическую помощь при
          выраженном истощении.
        </span>
      </footer>
    </article>
  );
};

export const PrintSummary: React.FC<{
  state: AppState;
  options?: PrintOptions;
}> = ({ state, options = DEFAULT_PRINT_OPTIONS }) => {
  return (
    <div className="hidden print-only bg-white text-[#1C1629]">
      <PrintSheetContent state={state} options={options} />
    </div>
  );
};

interface PrintPreviewModalProps {
  isOpen: boolean;
  state: AppState;
  options: PrintOptions;
  onChangeOptions: (next: PrintOptions) => void;
  onClose: () => void;
}

const PRIVACY_TOGGLES: {
  key: keyof PrintOptions;
  label: string;
}[] = [
  { key: 'includeDiagnostic', label: 'Профиль и 4 практики' },
  { key: 'includeTracker', label: 'Трекер «если — то» и силы' },
  { key: 'includeSosCard', label: 'Карманная аптечка (2 мин)' },
  { key: 'includeEvening', label: 'Вечерний итог' },
];

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  state,
  options,
  onChangeOptions,
  onClose,
}) => {
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = window.requestAnimationFrame(() => {
      modalPanelRef.current?.focus({ preventScroll: true });
    });

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
        ).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        );

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
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (opener && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleOption = (key: keyof PrintOptions) => {
    onChangeOptions({
      ...options,
      [key]: !options[key],
    });
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 backdrop-blur-xs"
      style={{ background: 'var(--scrim)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-preview-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalPanelRef}
        tabIndex={-1}
        className="pop-in relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl overflow-hidden focus:outline-none"
        style={{
          background: '#FCF9F3',
          color: 'var(--ink)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Header Bar */}
        <div
          className="shrink-0 flex items-start justify-between gap-4 px-4 sm:px-6 py-4 text-white"
          style={{ background: 'var(--grad-violet-deep)' }}
        >
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 type-kicker text-[#CBE2F7]">
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Формат A4 · Локальная печать</span>
            </div>
            <h2
              id="print-preview-modal-title"
              className="font-editorial text-xl sm:text-2xl leading-tight text-white"
            >
              Предпросмотр PDF-памятки
            </h2>
            <p className="text-[12.5px] leading-snug text-[#E4EEF7]/90 max-w-2xl">
              Выберите разделы перед печатью или сохранением в PDF (например,
              скройте личные записи, если распечатываете памятку на работу).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть предпросмотр PDF-памятки"
            className="shrink-0 inline-flex items-center justify-center rounded-xl min-w-[44px] min-h-[44px] text-white/90 bg-white/10 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Privacy Toggle Bar */}
        <div className="shrink-0 bg-[#FAF7F1] border-b border-[#1C1629]/12 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
          <span className="type-kicker text-[#615875] mr-1">
            Разделы в PDF:
          </span>
          {PRIVACY_TOGGLES.map(({ key, label }) => {
            const active = options[key];
            const emptyEveningHint =
              key === 'includeEvening' && state.threeGoodThings.length === 0;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleOption(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all cursor-pointer min-h-[36px] border ${
                  active
                    ? 'bg-[#ECE6F6] border-[#523B7D]/40 text-[#38255C] shadow-2xs'
                    : 'bg-white border-[#1C1629]/15 text-[#615875] hover:border-[#1C1629]/30'
                }`}
              >
                {active ? (
                  <Eye className="h-3.5 w-3.5 text-[#523B7D]" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-[#615875]" aria-hidden="true" />
                )}
                <span>{label}</span>
                {emptyEveningHint && (
                  <span className="text-[11px] font-normal text-[#615875]">
                    (нет записей)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable A4 Paper Stage */}
        <div className="flex-1 overflow-y-auto bg-[#E5DDD0]/80 p-4 sm:p-6">
          <div className="max-w-[794px] mx-auto bg-white rounded-xl shadow-[0_12px_36px_rgba(28,22,41,0.16)] border border-[#1C1629]/12 p-6 sm:p-8">
            <PrintSheetContent state={state} options={options} />
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="shrink-0 bg-[#FCF9F3] border-t border-[#1C1629]/12 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[12px] text-[#615875] leading-snug">
            В окне печати выберите «Сохранить как PDF» и включите «Фоновая
            графика» для цветной версии.
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-paper inline-flex items-center justify-center rounded-xl px-4 py-2.5 type-pill min-h-[44px] cursor-pointer"
            >
              Закрыть
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-violet inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 type-pill min-h-[44px] cursor-pointer"
            >
              <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Сохранить в PDF / Печать</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
