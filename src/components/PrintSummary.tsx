import React from 'react';
import { ClusterId, METHODS } from '../data/methods';
import { AppState } from '../types/app';
import { DAY_LABELS, formatEntryDateLabel } from '../utils/storage';

const AXIS_NAMES: Record<ClusterId, string> = {
  body: 'Телесное напряжение',
  mind: 'Мысли и эмоции',
  boundaries: 'Границы и отдых',
  resource: 'Дефицит ресурса',
};

export const PrintSummary: React.FC<{ state: AppState }> = ({ state }) => {
  const recommended = (state.diagnostic?.recommendedIds ?? [])
    .map((id) => METHODS.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const overallAverage = state.diagnostic
    ? Math.round(
        Object.values(state.diagnostic.scores).reduce((sum, val) => sum + val, 0) / 4
      )
    : 0;

  const markedResources = state.resourceLevels.filter(
    (v): v is number => v !== null
  );
  const avgResource =
    markedResources.length > 0
      ? (
          markedResources.reduce((sum, v) => sum + v, 0) / markedResources.length
        )
          .toFixed(1)
          .replace('.', ',')
      : null;

  return (
    <div className="hidden print-only p-4 text-[#1C1629] space-y-6">
      <header className="border-b border-[#1C1629]/30 pb-3 flex items-baseline justify-between">
        <div>
          <h1 className="font-editorial text-2xl font-semibold text-[#1C1629]">
            Опора ресурса — Личная памятка саморегуляции
          </h1>
          <p className="text-sm text-[#615875] mt-1">
            Сформировано локально: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </div>
      </header>

      {/* Diagnostic Summary */}
      <section className="space-y-2.5 print-card">
        <h2 className="font-editorial text-lg font-semibold border-b border-[#1C1629]/20 pb-1 text-[#1C1629]">
          1. Самооценка состояния
        </h2>
        {state.diagnostic ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm border border-[#1C1629]/20 rounded-[4px] p-2.5">
              <span>
                <strong>Приоритет внимания:</strong>{' '}
                {AXIS_NAMES[state.diagnostic.topAxes[0]]}
                {state.diagnostic.topAxes[1] &&
                  state.diagnostic.scores[state.diagnostic.topAxes[1]] >= 25 &&
                  `, а также ${AXIS_NAMES[state.diagnostic.topAxes[1]].toLowerCase()}`}
              </span>
              <strong>Общая нагрузка: {overallAverage}%</strong>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {(['body', 'mind', 'boundaries', 'resource'] as ClusterId[]).map(
                (axis) => (
                  <div
                    key={axis}
                    className="border border-[#1C1629]/20 rounded-[4px] p-2.5 flex justify-between print-card"
                  >
                    <span>{AXIS_NAMES[axis]}</span>
                    <strong>{state.diagnostic!.scores[axis]}%</strong>
                  </div>
                )
              )}
            </div>

            {recommended.length > 0 && (
              <div className="space-y-1.5 print-card">
                <p className="text-sm font-semibold">Рекомендованные методики:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {recommended.map((m) => (
                    <li key={m.id}>
                      <strong>
                        №{String(m.id).padStart(2, '0')} {m.title}
                      </strong>{' '}
                      ({m.durationLabel}) — {m.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#615875]">
            Самооценка состояния пока не пройдена.
          </p>
        )}
      </section>

      {/* Active Habits & Weekly Resource */}
      <section className="space-y-3">
        <h2 className="font-editorial text-lg font-semibold border-b border-[#1C1629]/20 pb-1 text-[#1C1629]">
          2. Правила «если — то» (Метод №8)
        </h2>
        {state.habits.length > 0 ? (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1C1629]/30 text-left">
                <th className="py-1.5 pr-3">Правило</th>
                {DAY_LABELS.map((d) => (
                  <th key={d} className="py-1.5 px-1 text-center w-8">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.habits.map((h) => (
                <tr key={h.id} className="border-b border-[#1C1629]/15">
                  <td className="py-2 pr-3">
                    <div>
                      <strong>Если:</strong> {h.trigger}
                    </div>
                    <div>
                      <strong>То:</strong> {h.action}
                    </div>
                  </td>
                  {h.checks.map((c, idx) => (
                    <td key={idx} className="py-2 px-1 text-center">
                      {c ? '✓' : '·'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-[#615875]">Активных правил пока нет.</p>
        )}

        <div className="border border-[#1C1629]/20 rounded-[4px] p-2.5 text-sm space-y-1.5 print-card">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Уровень сил за неделю (1–10)</span>
            {avgResource && (
              <span className="text-[#615875]">Средний уровень: {avgResource} / 10</span>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {DAY_LABELS.map((day, idx) => {
              const lvl = state.resourceLevels[idx];
              return (
                <div
                  key={day}
                  className="border border-[#1C1629]/15 rounded-[3px] py-1 px-1"
                >
                  <div className="text-[11px] text-[#615875]">{day}</div>
                  <div className="font-semibold">{lvl !== null ? lvl : '—'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Three Good Things */}
      {state.threeGoodThings.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 border-b border-[#1C1629]/20 pb-1">
            <h2 className="font-editorial text-lg font-semibold text-[#1C1629]">
              3. Вечерний итог (Метод №28)
            </h2>
            {state.threeGoodThings.length > 3 && (
              <span className="text-xs text-[#615875]">
                Показаны 3 из {state.threeGoodThings.length} записей
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {state.threeGoodThings.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="border border-[#1C1629]/20 rounded-[4px] p-2.5 print-card"
              >
                <p className="font-semibold mb-1">{formatEntryDateLabel(entry)}</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {entry.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
