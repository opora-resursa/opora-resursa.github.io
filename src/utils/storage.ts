import {
  AppState,
  DiagnosticAnswers,
  DiagnosticResult,
  HabitRule,
  ThreeGoodEntry,
} from '../types/app';
import { ClusterId, METHODS } from '../data/methods';

export const STORAGE_KEY = 'opora_resursa_state_v1';

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const VALID_CLUSTERS: ClusterId[] = ['body', 'mind', 'boundaries', 'resource'];

export function getCurrentWeekdayIndex(): number {
  const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon .. 6 = Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function getLocalIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatEntryDateLabel(entry: {
  dateLabel: string;
  isoDate?: string;
}): string {
  if (entry.isoDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(entry.isoDate);
    let parsed: Date | null = null;
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const candidate = new Date(year, month - 1, day);
      if (
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day
      ) {
        parsed = candidate;
      }
    } else {
      const candidate = new Date(entry.isoDate);
      if (!Number.isNaN(candidate.getTime())) {
        parsed = candidate;
      }
    }

    if (parsed) {
      const now = new Date();
      const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const targetMid = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      const formatted = targetMid.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });

      if (targetMid.getTime() === todayMid.getTime()) {
        return `Сегодня · ${formatted}`;
      }
      if (targetMid.getTime() === yesterdayMid.getTime()) {
        return `Вчера · ${formatted}`;
      }
      return formatted;
    }
  }

  const rawLabel = (entry.dateLabel ?? '').trim();
  if (rawLabel.startsWith('Сегодня · ')) {
    return rawLabel.slice('Сегодня · '.length).trim() || 'Запись';
  }
  return rawLabel || 'Запись';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function sanitizePlainRecord<T>(
  raw: unknown,
  validateValue: (value: unknown) => value is T
): Record<string, T> {
  if (!isPlainObject(raw)) return {};
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (validateValue(value)) {
      result[key] = value;
    }
  }
  return result;
}

function sanitizeWorksheets(raw: unknown): Record<number, Record<string, string>> {
  if (!isPlainObject(raw)) return {};
  const result: Record<number, Record<string, string>> = {};
  for (const [key, val] of Object.entries(raw)) {
    const numKey = Number(key);
    if (!Number.isInteger(numKey) || numKey <= 0 || !isPlainObject(val)) {
      continue;
    }
    result[numKey] = sanitizePlainRecord(
      val,
      (entry): entry is string => typeof entry === 'string'
    );
  }
  return result;
}

function sanitizeJournals(raw: unknown): Record<number, string> {
  if (!isPlainObject(raw)) return {};
  const result: Record<number, string> = {};
  for (const [key, val] of Object.entries(raw)) {
    const numKey = Number(key);
    if (Number.isInteger(numKey) && numKey > 0 && typeof val === 'string') {
      result[numKey] = val;
    }
  }
  return result;
}

function isClusterId(val: unknown): val is ClusterId {
  return typeof val === 'string' && VALID_CLUSTERS.includes(val as ClusterId);
}

export function sanitizeDiagnostic(raw: unknown): DiagnosticResult | null {
  if (!isPlainObject(raw)) return null;
  if (!isPlainObject(raw.scores)) return null;

  const scores = {} as Record<ClusterId, number>;
  for (const axis of VALID_CLUSTERS) {
    const val = raw.scores[axis];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return null;
    }
    scores[axis] = Math.min(100, Math.max(0, Math.round(val)));
  }

  if (!Array.isArray(raw.topAxes)) return null;
  const topAxes: ClusterId[] = [];
  for (const axis of raw.topAxes) {
    if (isClusterId(axis) && !topAxes.includes(axis)) {
      topAxes.push(axis);
    }
    if (topAxes.length === 2) break;
  }
  if (topAxes.length === 0) return null;

  const fallbackPick = pickRecommendedMethods(scores);
  for (const axis of fallbackPick.topAxes) {
    if (topAxes.length < 2 && !topAxes.includes(axis)) {
      topAxes.push(axis);
    }
  }

  const finalRecommendedIds: number[] = [];
  if (Array.isArray(raw.recommendedIds)) {
    for (const id of raw.recommendedIds) {
      if (
        typeof id === 'number' &&
        Number.isInteger(id) &&
        METHODS.some((m) => m.id === id) &&
        !finalRecommendedIds.includes(id)
      ) {
        finalRecommendedIds.push(id);
      }
      if (finalRecommendedIds.length === 4) break;
    }
  }
  for (const id of fallbackPick.recommendedIds) {
    if (finalRecommendedIds.length < 4 && !finalRecommendedIds.includes(id)) {
      finalRecommendedIds.push(id);
    }
  }

  const answers: DiagnosticAnswers = {};
  if (isPlainObject(raw.answers)) {
    for (const [k, v] of Object.entries(raw.answers)) {
      if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 4) {
        answers[k] = v;
      }
    }
  }

  const completedAt =
    typeof raw.completedAt === 'string' && raw.completedAt.trim()
      ? raw.completedAt
      : new Date().toISOString();

  return {
    answers,
    scores,
    topAxes,
    recommendedIds: finalRecommendedIds,
    completedAt,
  };
}

export function sanitizeThreeGoodThings(raw: unknown): ThreeGoodEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ThreeGoodEntry[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    if (!isPlainObject(item) || !Array.isArray(item.items)) continue;
    const cleanedItems = item.items
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    if (cleanedItems.length === 0) continue;

    const baseId =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `refl-${i}-${Date.now()}`;
    let id = baseId;
    if (seenIds.has(id)) {
      let suffix = 1;
      while (seenIds.has(`${baseId}-${suffix}`)) {
        suffix += 1;
      }
      id = `${baseId}-${suffix}`;
    }
    seenIds.add(id);

    const dateLabel =
      typeof item.dateLabel === 'string' && item.dateLabel.trim()
        ? item.dateLabel.trim()
        : 'Запись';
    const isoDate =
      typeof item.isoDate === 'string' && item.isoDate.trim()
        ? item.isoDate.trim()
        : undefined;
    const isSeed = typeof item.isSeed === 'boolean' ? item.isSeed : undefined;

    entries.push({
      id,
      dateLabel,
      ...(isoDate ? { isoDate } : {}),
      items: cleanedItems,
      ...(isSeed !== undefined ? { isSeed } : {}),
    });
  }
  return entries;
}

export function createDefaultState(): AppState {
  const todayIdx = getCurrentWeekdayIndex();
  const sampleResources: (number | null)[] = Array.from({ length: 7 }, (_, i) => {
    if (i >= todayIdx) return null;
    const base = [6, 5, 7, 6, 7, 8, 7];
    return base[i] ?? 6;
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = getLocalIsoDate(yesterday);

  const defaultHabits: HabitRule[] = [
    {
      id: 'seed-1',
      trigger: 'Завершил(а) сложный приём или урок, и есть 2 минуты тишины',
      action: 'Делаю 2 минуты медленного комфортного дыхания с плавным выдохом (№3)',
      methodId: 3,
      checks: DAY_LABELS.map((_, i) => i < todayIdx && i % 2 === 0),
    },
    {
      id: 'seed-2',
      trigger: 'Закрываю дверь кабинета в конце рабочего дня',
      action: 'Выписываю незавершённые дела на завтра и отключаю рабочие чаты (№11)',
      methodId: 11,
      checks: DAY_LABELS.map((_, i) => i < todayIdx && i !== 2),
    },
    {
      id: 'seed-3',
      trigger: 'Готовлюсь ко сну после напряжённого дня',
      action: 'Записываю 3 небольших хороших события дня в трекер (№28)',
      methodId: 28,
      checks: DAY_LABELS.map((_, i) => i < todayIdx && i >= 1),
    },
  ];

  const defaultReflections: ThreeGoodEntry[] = [
    {
      id: 'refl-seed-1',
      dateLabel: 'Пример записи',
      isoDate: yesterdayIso,
      isSeed: true,
      items: [
        'Удалось спокойно пообедать 20 минут без телефона и отчётов',
        'Коллега поддержал(а) тёплой репликой после трудного разбора',
        'Вышел(а) из кабинета вовремя и прошёл(а) одну остановку пешком',
      ],
    },
  ];

  return {
    diagnostic: null,
    habits: defaultHabits,
    resourceLevels: sampleResources,
    todayIndex: todayIdx,
    threeGoodThings: defaultReflections,
    worksheets: {},
    journals: {},
  };
}

export function createEmptyState(): AppState {
  return {
    diagnostic: null,
    habits: [],
    resourceLevels: [null, null, null, null, null, null, null],
    todayIndex: getCurrentWeekdayIndex(),
    threeGoodThings: [],
    worksheets: {},
    journals: {},
  };
}

export function loadAppState(): AppState {
  const fallback = createDefaultState();
  const currentTodayIndex = getCurrentWeekdayIndex();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!isPlainObject(parsed)) return fallback;

    return {
      diagnostic: sanitizeDiagnostic(parsed.diagnostic),
      habits: Array.isArray(parsed.habits) ? sanitizeHabits(parsed.habits) : fallback.habits,
      resourceLevels:
        Array.isArray(parsed.resourceLevels) && parsed.resourceLevels.length === 7
          ? parsed.resourceLevels.map((v) =>
              typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 10 ? v : null
            )
          : fallback.resourceLevels,
      todayIndex: currentTodayIndex,
      threeGoodThings: Array.isArray(parsed.threeGoodThings)
        ? sanitizeThreeGoodThings(parsed.threeGoodThings)
        : fallback.threeGoodThings,
      worksheets: sanitizeWorksheets(parsed.worksheets),
      journals: sanitizeJournals(parsed.journals),
    };
  } catch {
    return fallback;
  }
}

function sanitizeHabits(habits: unknown[]): HabitRule[] {
  const result: HabitRule[] = [];
  const seenIds = new Set<string>();

  for (let idx = 0; idx < habits.length; idx += 1) {
    const h = habits[idx];
    if (!isPlainObject(h)) continue;

    const rawTrigger = typeof h.trigger === 'string' ? h.trigger : '';
    const rawAction = typeof h.action === 'string' ? h.action : '';

    const trigger =
      rawTrigger === 'Завершил(а) сложный приём или урок и есть 2 минуты тишины'
        ? 'Завершил(а) сложный приём или урок, и есть 2 минуты тишины'
        : rawTrigger;

    const action =
      h.id === 'seed-2' && rawAction.includes('Паркую')
        ? 'Выписываю незавершённые дела на завтра и отключаю рабочие чаты (№11)'
        : rawAction;

    if (!trigger.trim() && !action.trim()) continue;

    const baseId =
      typeof h.id === 'string' && h.id.trim()
        ? h.id.trim()
        : `habit-${idx}-${Date.now()}`;
    let id = baseId;
    if (seenIds.has(id)) {
      const exactDuplicate = result.some(
        (existing) =>
          existing.id === baseId &&
          existing.trigger.trim() === trigger.trim() &&
          existing.action.trim() === action.trim()
      );
      if (exactDuplicate) continue;

      let suffix = 1;
      while (seenIds.has(`${baseId}-${suffix}`)) {
        suffix += 1;
      }
      id = `${baseId}-${suffix}`;
    }
    seenIds.add(id);

    const methodId =
      typeof h.methodId === 'number' &&
      Number.isInteger(h.methodId) &&
      METHODS.some((m) => m.id === h.methodId)
        ? h.methodId
        : undefined;

    result.push({
      id,
      trigger,
      action,
      methodId,
      checks:
        Array.isArray(h.checks) && h.checks.length === 7
          ? h.checks.map(Boolean)
          : [false, false, false, false, false, false, false],
    });
  }

  return result;
}

export function saveAppState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function validateImportedBackup(data: unknown): AppState | null {
  if (!isPlainObject(data)) return null;
  const candidate = data as Partial<AppState>;
  const hasKnownKey =
    'habits' in candidate ||
    'diagnostic' in candidate ||
    'resourceLevels' in candidate ||
    'threeGoodThings' in candidate ||
    'worksheets' in candidate ||
    'journals' in candidate;
  if (!hasKnownKey) return null;

  const base = createEmptyState();
  return {
    diagnostic: sanitizeDiagnostic(candidate.diagnostic),
    habits: Array.isArray(candidate.habits) ? sanitizeHabits(candidate.habits) : base.habits,
    resourceLevels:
      Array.isArray(candidate.resourceLevels) && candidate.resourceLevels.length === 7
        ? candidate.resourceLevels.map((v) =>
            typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 10 ? v : null
          )
        : base.resourceLevels,
    todayIndex: getCurrentWeekdayIndex(),
    threeGoodThings: Array.isArray(candidate.threeGoodThings)
      ? sanitizeThreeGoodThings(candidate.threeGoodThings)
      : base.threeGoodThings,
    worksheets: sanitizeWorksheets(candidate.worksheets),
    journals: sanitizeJournals(candidate.journals),
  };
}

/** Deterministic recommendation picker based on top load axes */
export function pickRecommendedMethods(scores: Record<ClusterId, number>): {
  topAxes: ClusterId[];
  recommendedIds: number[];
} {
  const ranked = (Object.keys(scores) as ClusterId[]).sort((a, b) => scores[b] - scores[a]);
  const topAxes = ranked.slice(0, 2);

  // Curated high-utility primary recommendations per cluster (prioritizing RCTs & quick applicability)
  const clusterPriority: Record<ClusterId, number[]> = {
    body: [1, 3, 13, 19, 14, 21],
    mind: [4, 15, 16, 25, 5, 17],
    boundaries: [8, 11, 7, 10, 9, 12],
    resource: [28, 30, 29],
  };

  const chosen: number[] = [];
  for (const axis of topAxes) {
    for (const id of clusterPriority[axis]) {
      if (chosen.length < 4 && !chosen.includes(id) && METHODS.some((m) => m.id === id)) {
        chosen.push(id);
      }
      if (chosen.filter((cid) => METHODS.find((m) => m.id === cid)?.cluster === axis).length >= 2) {
        break;
      }
    }
  }

  for (const axis of ranked) {
    for (const id of clusterPriority[axis]) {
      if (chosen.length < 4 && !chosen.includes(id)) {
        chosen.push(id);
      }
    }
  }

  return { topAxes, recommendedIds: chosen.slice(0, 4) };
}
