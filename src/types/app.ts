import { ClusterId } from '../data/methods';

export type DiagnosticAnswers = Record<string, number>;

export interface DiagnosticResult {
  answers: DiagnosticAnswers;
  /** 0..100 load percentage per cluster */
  scores: Record<ClusterId, number>;
  /** Top 1-2 clusters needing support */
  topAxes: ClusterId[];
  /** 4 recommended method IDs */
  recommendedIds: number[];
  completedAt: string;
}

export interface HabitRule {
  id: string;
  trigger: string;
  action: string;
  methodId?: number;
  /** 7 booleans: Monday (0) .. Sunday (6) */
  checks: boolean[];
}

export interface ThreeGoodEntry {
  id: string;
  dateLabel: string;
  isoDate?: string;
  items: string[];
  isSeed?: boolean;
}

export interface AppState {
  diagnostic: DiagnosticResult | null;
  habits: HabitRule[];
  /** 7 values for Mon..Sun (1..10 or null) */
  resourceLevels: (number | null)[];
  hasSampleResources?: boolean;
  /** Index 0..6 representing today in the Mon..Sun matrix */
  todayIndex: number;
  threeGoodThings: ThreeGoodEntry[];
  /** Saved worksheet answers keyed by methodId -> fieldId -> value */
  worksheets: Record<number, Record<string, string>>;
  /** Saved expressive writing text keyed by methodId */
  journals: Record<number, string>;
}
