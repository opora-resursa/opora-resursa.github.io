import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FilterX,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  ClusterId,
  CLUSTER_META,
  DurationBucket,
  EVIDENCE_META,
  EvidenceTier,
  METHODS,
  RegulationMethod,
} from '../data/methods';
import { Reveal } from './Reveal';

type ClusterFilter = 'all' | ClusterId;

interface CatalogSectionProps {
  recommendedIds: number[];
  trackedMethodIds?: number[];
  onlyRecommended: boolean;
  onToggleOnlyRecommended: (val: boolean) => void;
  onOpenMethod: (method: RegulationMethod) => void;
  onAddMethodToTracker: (method: RegulationMethod) => void;
  onGoToTracker?: () => void;
}

const RU_ENDINGS_RE =
  /(?:ие|ия|ый|ий|ая|ое|ые|ом|ем|ой|ей|ов|ам|ям|ах|ях|а|я|у|ю|ы|и|е|о)$/;

function normalizeSearchToken(word: string): string {
  const cleaned = word
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9-]/g, '');
  if (cleaned.length < 5) return cleaned;
  const stripped = cleaned.replace(RU_ENDINGS_RE, '');
  return stripped.length >= 3 ? stripped : cleaned;
}

const INITIAL_VISIBLE = 4;
const STEP_VISIBLE = 6;
const STARTER_METHOD_IDS = [3, 15, 8, 28, 1, 13];

const DURATION_OPTIONS: { value: 'all' | DurationBucket; label: string }[] = [
  { value: 'all', label: 'Любая' },
  { value: '1-3', label: '1–3 мин' },
  { value: '5-15', label: '5–15 мин' },
  { value: 'program', label: 'Программа' },
];

const EVIDENCE_OPTIONS: { value: 'all' | EvidenceTier; label: string }[] = [
  { value: 'all', label: 'Все уровни' },
  { value: 'rct_direct', label: 'Прямые РКИ' },
  { value: 'indirect_component', label: 'Косвенные / компонент' },
  { value: 'somatic_practice', label: 'Телесная практика' },
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  recommendedIds,
  trackedMethodIds = [],
  onlyRecommended,
  onToggleOnlyRecommended,
  onOpenMethod,
  onAddMethodToTracker,
  onGoToTracker,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<ClusterFilter>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | DurationBucket>('all');
  const [selectedEvidence, setSelectedEvidence] = useState<'all' | EvidenceTier>('all');
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Record<number, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [
    searchQuery,
    selectedCluster,
    selectedDuration,
    selectedEvidence,
    onlyRecommended,
  ]);

  const clusterCounts = useMemo(() => {
    const counts: Record<ClusterFilter, number> = {
      all: METHODS.length,
      body: 0,
      mind: 0,
      boundaries: 0,
      resource: 0,
    };
    for (const m of METHODS) {
      counts[m.cluster] += 1;
    }
    return counts;
  }, []);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedCluster !== 'all' ||
      selectedDuration !== 'all' ||
      selectedEvidence !== 'all' ||
      onlyRecommended
  );

  const filteredMethods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/ё/g, 'е');
    const queryTokens = q
      .split(/\s+/)
      .filter(Boolean)
      .map(normalizeSearchToken)
      .filter(Boolean);

    const filtered = METHODS.filter((m) => {
      if (onlyRecommended && recommendedIds.length > 0 && !recommendedIds.includes(m.id)) {
        return false;
      }
      if (selectedCluster !== 'all' && m.cluster !== selectedCluster) {
        return false;
      }
      if (selectedDuration !== 'all' && m.durationBucket !== selectedDuration) {
        return false;
      }
      if (selectedEvidence !== 'all' && m.evidenceTier !== selectedEvidence) {
        return false;
      }
      if (queryTokens.length > 0) {
        const rawHaystack =
          `${m.title} ${m.shortTitle} ${m.author} ${m.description} ${m.situationTag} ${m.evidenceBadge}`
            .toLowerCase()
            .replace(/ё/g, 'е');
        const haystackTokens = rawHaystack
          .split(/[\s.,!?;:()«»"—–/]+/)
          .filter(Boolean)
          .map(normalizeSearchToken);

        const matchesAll = queryTokens.every(
          (token) =>
            rawHaystack.includes(token) ||
            haystackTokens.some((ht) => ht.includes(token))
        );
        if (!matchesAll) return false;
      }
      return true;
    });

    if (recommendedIds.length > 0) {
      return [...filtered].sort((a, b) => {
        const aRec = recommendedIds.includes(a.id);
        const bRec = recommendedIds.includes(b.id);
        if (aRec !== bRec) return aRec ? -1 : 1;
        return a.id - b.id;
      });
    }

    if (!hasActiveFilters) {
      const starterOrder = new Map(STARTER_METHOD_IDS.map((id, idx) => [id, idx]));
      return [...filtered].sort((a, b) => {
        const aIdx = starterOrder.get(a.id);
        const bIdx = starterOrder.get(b.id);
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
        if (aIdx !== undefined) return -1;
        if (bIdx !== undefined) return 1;
        return a.id - b.id;
      });
    }

    return [...filtered].sort((a, b) => a.id - b.id);
  }, [
    searchQuery,
    selectedCluster,
    selectedDuration,
    selectedEvidence,
    onlyRecommended,
    recommendedIds,
    hasActiveFilters,
  ]);

  const shownCount = Math.min(visibleCount, filteredMethods.length);
  const remaining = Math.max(0, filteredMethods.length - shownCount);
  const visibleMethods = useMemo(
    () => filteredMethods.slice(0, visibleCount),
    [filteredMethods, visibleCount]
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCluster('all');
    setSelectedDuration('all');
    setSelectedEvidence('all');
    onToggleOnlyRecommended(false);
  };

  const toggleEvidence = (id: number) => {
    setExpandedEvidenceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCollapse = () => {
    setVisibleCount(INITIAL_VISIBLE);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      const rect = catalogEl.getBoundingClientRect();
      if (rect.top < 0) {
        const prefersReduced =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        catalogEl.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    }
  };

  return (
    <section
      id="catalog"
      className="no-print relative overflow-x-clip scroll-mt-24 bg-[#EFE8DC]"
    >
      {/* Subtle localized sky-blue spotlight behind header right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 w-[440px] h-[360px] rounded-full blur-3xl opacity-75"
        style={{
          background:
            'radial-gradient(circle, rgba(228, 238, 247, 0.95) 0%, rgba(180, 205, 228, 0.35) 45%, transparent 72%)',
        }}
      />
      {/* Soft localized lavender ambient glow behind sticky left filter panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-48 -left-16 w-[380px] h-[440px] rounded-full blur-3xl opacity-65"
        style={{
          background:
            'radial-gradient(circle, rgba(107, 80, 158, 0.16) 0%, rgba(236, 230, 246, 0.55) 46%, transparent 72%)',
        }}
      />

      <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-16 space-y-6">
        <Reveal>
          {/* Clean Newspaper Double-Top Rule Header (NO 4 giant preset banner tiles) */}
          <div className="gazette-double-top pt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2.5 max-w-3xl">
              <span className="type-kicker text-[#3D6A94]">
                Раздел 02 · Библиотека практик
              </span>
              <h2 className="font-gazette-tall text-3xl sm:text-4xl lg:text-[48px] text-[#1C1629]">
                30 МЕТОДИК САМОРЕГУЛЯЦИИ
              </h2>
              <p className="type-meta max-w-2xl">
                Отфильтруйте практики по задаче, длительности или уровню
                доказательности. Нажмите «Открыть практику» для интерактивного
                тренажёра или рабочей формы, либо «+ В трекер», чтобы добавить
                технику в план недели.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="gazette-stamp text-[#523B7D]">
                Всего {filteredMethods.length} · открыто {shownCount}
              </span>
            </div>
          </div>
        </Reveal>

        {/* Main Filter Sidebar + 2-Column Method Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[268px_1fr] gap-6 items-start">
          {/* Left Sticky Filter Card */}
          <aside className="paper-card p-4 space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto">
            {/* Search Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="catalog-search"
                className="block type-kicker text-[#615875]"
              >
                Поиск по названию или автору
              </label>
              <div className="relative">
                <Search
                  className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#857C99]"
                  aria-hidden="true"
                />
                <input
                  id="catalog-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Дыхание, ACT, границы..."
                  className="w-full rounded-xl pl-10 pr-3 py-2 text-[14.5px] bg-[#F7F2E7] border border-[#1C1629]/18 text-[#1C1629] placeholder:text-[#857C99] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#523B7D] min-h-[42px]"
                />
              </div>
            </div>

            {/* Recommended Toggle */}
            {recommendedIds.length > 0 && (
              <div className="rounded-xl p-3 bg-[#ECE6F6] border border-[#CBBEE4]">
                <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold text-[#38255C]">
                    <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Только рекомендованные мне</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={onlyRecommended}
                    onChange={(e) => onToggleOnlyRecommended(e.target.checked)}
                    className="h-4 w-4 accent-[#523B7D] rounded cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* 4 Cluster Filters with Counts */}
            <div className="space-y-1.5">
              <p className="type-kicker text-[#615875]">Направление</p>
              <div className="space-y-1">
                {(
                  [
                    { id: 'all', label: 'Все методики' },
                    { id: 'body', label: CLUSTER_META.body.shortLabel },
                    { id: 'mind', label: CLUSTER_META.mind.shortLabel },
                    { id: 'boundaries', label: CLUSTER_META.boundaries.shortLabel },
                    { id: 'resource', label: CLUSTER_META.resource.shortLabel },
                  ] as const
                ).map((item) => {
                  const active = selectedCluster === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCluster(item.id)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-150 min-h-[40px] cursor-pointer hover:-translate-y-[1px] ${
                        active
                          ? 'btn-violet'
                          : 'bg-[#F7F2E7] text-[#1C1629] border border-[#1C1629]/11 hover:border-[#CBBEE4] hover:bg-[#ECE6F6]/50'
                      }`}
                    >
                      <span className="text-left">{item.label}</span>
                      <span
                        className="font-gazette-mono text-[11.5px]"
                        style={{ opacity: active ? 0.9 : 0.65 }}
                      >
                        {clusterCounts[item.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Filter */}
            <div className="space-y-2">
              <p className="type-kicker text-[#615875]">Длительность</p>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map((opt) => {
                  const active = selectedDuration === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedDuration(opt.value)}
                      className={`rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all duration-150 min-h-[38px] cursor-pointer hover:-translate-y-[1px] ${
                        active
                          ? 'btn-violet'
                          : 'bg-[#F7F2E7] text-[#362E47] border border-[#1C1629]/18 hover:border-[#CBBEE4] hover:bg-[#ECE6F6]/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evidence Tier Filter */}
            <div className="space-y-2">
              <p className="type-kicker text-[#615875]">Доказательная база</p>
              <div className="space-y-1.5">
                {EVIDENCE_OPTIONS.map((opt) => {
                  const active = selectedEvidence === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedEvidence(opt.value)}
                      className={`w-full text-left rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-150 min-h-[40px] cursor-pointer hover:-translate-y-[1px] ${
                        active
                          ? 'btn-sky'
                          : 'bg-[#F7F2E7] text-[#1C1629] border border-[#1C1629]/11 hover:border-[#B4CDE4] hover:bg-[#E4EEF7]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between text-[13.5px] border-t border-[#1C1629]/11 text-[#615875]">
              <span className="type-kicker">Найдено: {filteredMethods.length}</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-semibold text-[#523B7D] underline underline-offset-4 cursor-pointer transition-opacity hover:opacity-80"
                >
                  Сбросить
                </button>
              )}
            </div>
          </aside>

          {/* Right 2-Column Method Grid */}
          <div>
            {filteredMethods.length === 0 ? (
              <div className="paper-card p-10 text-center space-y-4">
                <FilterX
                  className="h-9 w-9 mx-auto text-[#615875]"
                  aria-hidden="true"
                />
                <div className="space-y-1.5">
                  <h3 className="font-editorial text-2xl text-[#1C1629]">
                    Ничего не найдено по текущим фильтрам
                  </h3>
                  <p className="type-meta">
                    Попробуйте изменить запрос или сбросить ограничения по времени и
                    доказательности.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-violet inline-flex items-center gap-2 rounded-xl px-5 py-2.5 type-pill min-h-[44px] cursor-pointer"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleMethods.map((method) => {
                  const clusterMeta = CLUSTER_META[method.cluster];
                  const evidenceMeta = EVIDENCE_META[method.evidenceTier];
                  const isRecommended = recommendedIds.includes(method.id);
                  const isTracked = trackedMethodIds.includes(method.id);
                  const isEvidenceOpen = Boolean(expandedEvidenceIds[method.id]);

                  return (
                    <article
                      key={method.id}
                      className="paper-card paper-card-hover overflow-hidden flex flex-col justify-between"
                      style={
                        isRecommended
                          ? { outline: '2px solid var(--violet)', outlineOffset: '-2px' }
                          : undefined
                      }
                    >
                      <div
                        aria-hidden="true"
                        className="h-[3px] w-full shrink-0"
                        style={{ background: clusterMeta.accent }}
                      />
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                        {/* Card Top Meta Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-num text-xl leading-none text-[#523B7D]">
                              №{String(method.id).padStart(2, '0')}
                            </span>
                            <span
                              className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[12px] font-semibold bg-[#F7F2E7] text-[#1C1629] border border-[#1C1629]/15"
                              style={{ borderLeft: `3px solid ${clusterMeta.accent}` }}
                            >
                              {clusterMeta.shortLabel}
                            </span>
                            {isRecommended && (
                              <span className="gazette-stamp text-[#523B7D]">
                                По профилю
                              </span>
                            )}
                          </div>

                          <span className="inline-flex items-center gap-1 font-gazette-mono text-[11.5px] text-[#615875] shrink-0">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {method.durationLabel}
                          </span>
                        </div>

                        {/* Title & Author */}
                        <div className="space-y-0.5">
                          <h3 className="font-editorial text-[18.5px] leading-snug text-[#1C1629]">
                            {method.title}
                          </h3>
                          <p className="type-micro text-[#615875]">{method.author}</p>
                        </div>

                        {/* Description */}
                        <p className="text-[14px] leading-[1.52] text-[#362E47] line-clamp-2">
                          {method.description}
                        </p>

                        {/* Evidence Badge + Expandable Scientific Note */}
                        <div className="space-y-2 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[12px] font-semibold ${evidenceMeta.toneClass}`}
                            >
                              {method.evidenceBadge}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleEvidence(method.id)}
                              aria-expanded={isEvidenceOpen}
                              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#3D6A94] underline underline-offset-4 cursor-pointer transition-opacity hover:opacity-80"
                            >
                              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Научная справка</span>
                              {isEvidenceOpen ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {isEvidenceOpen && (
                            <div className="rounded-xl p-3 text-[13px] leading-relaxed bg-[#E4EEF7] border border-[#B4CDE4] text-[#264A6D]">
                              {method.evidenceNote}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 mt-3 flex flex-wrap items-center gap-2 border-t border-[#1C1629]/11">
                        <button
                          type="button"
                          onClick={() => onOpenMethod(method)}
                          className="btn-violet flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 type-pill whitespace-nowrap text-[12.5px] sm:text-[13px] min-h-[40px] cursor-pointer"
                        >
                          <span>Открыть практику</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </button>

                        {isTracked ? (
                          <button
                            type="button"
                            onClick={() => onGoToTracker?.()}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 type-pill whitespace-nowrap text-[12.5px] sm:text-[13px] min-h-[40px] cursor-pointer bg-[#ECE6F6] text-[#38255C] border border-[#CBBEE4] hover:bg-[#E1D7F2] transition-colors"
                          >
                            <Check className="h-4 w-4 text-[#523B7D] shrink-0" aria-hidden="true" />
                            <span>В трекере</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddMethodToTracker(method)}
                            className="btn-paper inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 type-pill whitespace-nowrap text-[12.5px] sm:text-[13px] min-h-[40px] cursor-pointer"
                          >
                            <Plus className="h-4 w-4 text-[#523B7D] shrink-0" aria-hidden="true" />
                            <span>В трекер</span>
                          </button>
                        )}
                      </div>
                      </div>
                    </article>
                  );
                })}
                </div>

                {(filteredMethods.length > visibleCount ||
                  (visibleCount > INITIAL_VISIBLE &&
                    filteredMethods.length > INITIAL_VISIBLE)) && (
                  <div className="rounded-2xl bg-[#FCF9F3]/90 border border-[#523B7D]/18 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[14.5px] font-semibold text-[#1C1629]">
                        {filteredMethods.length > visibleCount
                          ? `Показано ${shownCount} из ${filteredMethods.length} методик`
                          : `Открыты все ${filteredMethods.length} методик`}
                      </p>
                      <p className="type-micro text-[#615875]">
                        {filteredMethods.length > visibleCount
                          ? 'Раскройте следующие практики или посмотрите весь каталог целиком'
                          : 'Можно вернуться к компактному виду из 4 карточек'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {filteredMethods.length > visibleCount && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleCount((prev) => prev + STEP_VISIBLE)
                            }
                            className="btn-violet inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 type-pill min-h-[42px] cursor-pointer"
                          >
                            <span>Показать ещё {Math.min(STEP_VISIBLE, remaining)}</span>
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setVisibleCount(filteredMethods.length)}
                            className="btn-paper inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 type-pill min-h-[42px] cursor-pointer"
                          >
                            <span>Раскрыть все ({filteredMethods.length})</span>
                          </button>
                        </>
                      )}

                      {visibleCount > INITIAL_VISIBLE &&
                        filteredMethods.length > INITIAL_VISIBLE && (
                          <button
                            type="button"
                            onClick={handleCollapse}
                            className="btn-paper inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 type-pill min-h-[42px] cursor-pointer"
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            <span>Свернуть до 4 методик</span>
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
