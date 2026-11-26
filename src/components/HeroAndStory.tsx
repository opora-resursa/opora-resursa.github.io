import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Wind } from 'lucide-react';
import {
  Reveal,
  ScrollStage,
  SectionBridge,
  useCursorSpotlight,
  useScrollParallax,
} from './Reveal';
import { SectionId } from './TopNavAndRail';

interface HeroAndStoryProps {
  onOpenQuickSos: () => void;
  onNavigate: (id: SectionId) => void;
}

const WHY_STEPS_PART1 = [
  {
    num: '01',
    title: 'Скрытая эмоциональная нагрузка',
    text: 'Приходится постоянно сопереживать, сдерживать реакции и выдерживать чужую тревогу.',
  },
  {
    num: '02',
    title: 'Тело остаётся в напряжении',
    text: 'Даже после смены плечи и челюсть зажаты, а мысли возвращаются к рабочим случаям.',
  },
  {
    num: '03',
    title: 'Выходных перестаёт хватать',
    text: 'Когда рабочая нагрузка неделями превышает восстановление, даже обычного сна и пары выходных перестаёт хватать.',
  },
];

const WHY_STEPS_PART2 = [
  {
    num: '04',
    title: 'Короткие паузы в течение смены',
    text: 'Техники на 2–5 минут встраиваются в обычный перерыв между приёмами, уроками и отчётами.',
  },
  {
    num: '05',
    title: 'Навык вместо случайных советов',
    text: 'Понятный цикл: заметить зону перегрузки, подобрать практику и закрепить её как привычку.',
  },
];

type BodyPointId = 'shoulders' | 'jaw' | 'exhale';

const BODY_CHECK_POINTS: {
  id: BodyPointId;
  idleLabel: string;
  doneLabel: string;
  hint: string;
}[] = [
  {
    id: 'shoulders',
    idleLabel: 'Плечи',
    doneLabel: '✓ Плечи',
    hint: 'Опустите плечи на пару сантиметров вниз от ушей.',
  },
  {
    id: 'jaw',
    idleLabel: 'Челюсть',
    doneLabel: '✓ Челюсть',
    hint: 'Разомкните зубы и дайте языку спокойно лечь вниз.',
  },
  {
    id: 'exhale',
    idleLabel: 'Выдох',
    doneLabel: '✓ Выдох',
    hint: 'Сделайте один медленный выдох чуть длиннее вдоха.',
  },
];

export const HeroAndStory: React.FC<HeroAndStoryProps> = ({
  onOpenQuickSos,
  onNavigate,
}) => {
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const story1SectionRef = useRef<HTMLElement | null>(null);
  const story2SectionRef = useRef<HTMLElement | null>(null);
  const story1StampRef = useRef<HTMLDivElement | null>(null);
  const heroImgRef = useRef<HTMLImageElement | null>(null);
  const story1ImgRef = useRef<HTMLImageElement | null>(null);
  const story2ImgRef = useRef<HTMLImageElement | null>(null);

  const [story1StampVisible, setStory1StampVisible] = useState(false);
  const [checkedPoints, setCheckedPoints] = useState<
    Record<BodyPointId, boolean>
  >({
    shoulders: false,
    jaw: false,
    exhale: false,
  });
  const [activePointHint, setActivePointHint] = useState<BodyPointId | null>(
    null
  );

  useCursorSpotlight(heroSectionRef);
  useCursorSpotlight(story1SectionRef);
  useCursorSpotlight(story2SectionRef);
  useScrollParallax(heroImgRef, 22, 0.045);
  useScrollParallax(story1ImgRef, 26, 0.05);
  useScrollParallax(story2ImgRef, 26, 0.05);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = story1StampRef.current;
    if (!node) return;

    const isVisibleNow = () =>
      node.getBoundingClientRect().top < window.innerHeight * 0.96;

    if (prefersReduced || isVisibleNow()) {
      setStory1StampVisible(true);
      return;
    }

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setStory1StampVisible(true);
      observer.disconnect();
      window.removeEventListener('scroll', onScrollCheck);
    };

    const onScrollCheck = () => {
      if (isVisibleNow()) reveal();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            break;
          }
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(node);
    window.addEventListener('scroll', onScrollCheck, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScrollCheck);
    };
  }, []);

  const handleTogglePoint = (id: BodyPointId) => {
    const nextChecked = !checkedPoints[id];
    setCheckedPoints((prev) => ({ ...prev, [id]: nextChecked }));
    setActivePointHint(nextChecked ? id : null);
  };

  const handleResetPoints = () => {
    setCheckedPoints({ shoulders: false, jaw: false, exhale: false });
    setActivePointHint(null);
  };

  const allBodyPointsChecked = BODY_CHECK_POINTS.every(
    (pt) => checkedPoints[pt.id]
  );
  const currentHintText = activePointHint
    ? BODY_CHECK_POINTS.find((pt) => pt.id === activePointHint)?.hint
    : undefined;

  return (
    <div className="no-print">
      {/* ================================================================= */}
      {/* COVER / HERO (#top, #1F192E)                                      */}
      {/* ================================================================= */}
      <section
        id="top"
        ref={heroSectionRef}
        className="scroll-mt-24 relative overflow-x-clip bg-[#1F192E] text-[#F4EFE6]"
      >
        {/* Whisper-quiet radial ambient lighting, cursor spotlight & hairlines */}
        <div
          aria-hidden="true"
          className="cursor-spotlight pointer-events-none absolute inset-0 z-0"
        />
        <div
          aria-hidden="true"
          className="cursor-spotlight-pattern pointer-events-none absolute inset-0 z-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 w-[620px] h-[520px] rounded-full blur-3xl opacity-45"
          style={{
            background:
              'radial-gradient(circle, rgba(107, 80, 158, 0.24) 0%, rgba(139, 176, 212, 0.10) 48%, transparent 72%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 w-[480px] h-[420px] rounded-full blur-3xl opacity-35"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 176, 212, 0.26) 0%, rgba(61, 106, 148, 0.14) 48%, transparent 72%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none max-w-[1220px] mx-auto absolute inset-y-0 inset-x-0 border-x border-[#F4EFE6]/[0.04]"
        />

        <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 pt-24 pb-8 sm:pt-28 sm:pb-10 min-h-[86vh] flex flex-col justify-between gap-8">
          {/* Ultra-Thin Single-Line Masthead Strip */}
          <div className="flex items-center justify-between gap-4 py-2 border-y border-[#F4EFE6]/12">
            <span className="font-gazette-mono text-[10px] uppercase tracking-[0.14em] text-[#D6CFE0]/75">
              № 01 · ПСИХОГИГИЕНА
            </span>
            <span className="font-gazette-mono text-[10px] uppercase tracking-[0.14em] text-[#8BB0D4]/85">
              30 МЕТОДИК
            </span>
          </div>

          {/* Spacious 2-Column Cover Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center my-auto py-4">
            <div className="lg:col-span-7 space-y-6">
              <div className="type-kicker text-[#8BB0D4]">
                ДЛЯ ВРАЧЕЙ, ПСИХОЛОГОВ, ПЕДАГОГОВ И СОЦРАБОТНИКОВ
              </div>

              <div className="space-y-3">
                <h1 className="font-gazette-tall text-[52px] sm:text-[64px] lg:text-[74px] leading-[0.96] tracking-tight text-[#F4EFE6]">
                  ОПОРА РЕСУРСА
                </h1>
                <p className="font-editorial-italic text-xl sm:text-2xl text-[#D6CFE0]">
                  Программа профилактики эмоционального выгорания
                </p>
              </div>

              <p className="text-[16.5px] leading-[1.6] text-[#D6CFE0] max-w-xl">
                Короткие техники саморегуляции, самооценка состояния и личный
                трекер восстановления — без регистрации.
              </p>

              {/* 2 Tactile Rounded-xl Buttons Side-by-Side on Desktop */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('diagnostics')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4EFE6] text-[#1F192E] px-6 py-3.5 text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(244,239,230,0.45)] min-h-[48px]"
                >
                  <span>Пройти самооценку</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onOpenQuickSos}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F4EFE6]/30 bg-[#F4EFE6]/5 text-[#F4EFE6] px-6 py-3.5 text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:border-[#8BB0D4] hover:bg-[#8BB0D4]/15 hover:-translate-y-0.5 hover:shadow-[0_0_22px_rgba(139,176,212,0.32)] min-h-[48px]"
                >
                  <Wind className="w-4 h-4 text-[#8BB0D4]" aria-hidden="true" />
                  <span>Снять напряжение (2 мин)</span>
                </button>
              </div>
            </div>

            {/* Right: Large Seamless Illuminated Editorial Figure */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <Reveal variant="figure-rise" className="w-full max-w-[420px]">
                <div className="relative w-full flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-full blur-3xl ambient-breathe"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(139, 176, 212, 0.28) 0%, rgba(107, 80, 158, 0.34) 48%, transparent 74%)',
                    }}
                  />
                  <div
                    className="relative z-10 w-full"
                    style={{
                      transform:
                        'translate3d(calc(var(--mx-norm, 0) * 7px), calc(var(--my-norm, 0) * 6px), 0)',
                    }}
                  >
                    <img
                      ref={heroImgRef}
                      src="./images/hero-equilibrium.webp"
                      alt="Тонкие линии равновесия и ветвь на глубоком фиолетовом фоне"
                      className="w-full h-auto object-contain select-none will-change-transform"
                      style={{
                        filter: 'drop-shadow(0 0 24px rgba(139, 176, 212, 0.22))',
                      }}
                    />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Centered Subtle Scroll Invitation */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => onNavigate('story')}
              className="group inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-gazette-mono tracking-[0.06em] text-[#D6CFE0]/75 hover:text-[#8BB0D4] cursor-pointer transition-colors"
            >
              <span>Листайте дальше</span>
              <ArrowDown
                className="w-3.5 h-3.5 text-[#8BB0D4] motion-safe:animate-bounce"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </section>

      <SectionBridge
        theme="dark"
        label="Глава 01 · Истощение"
      />

      {/* ================================================================= */}
      {/* STORY SPREAD 1 (#story, #261F38)                                  */}
      {/* ================================================================= */}
      <section
        id="story"
        ref={story1SectionRef}
        className="scroll-mt-24 on-dark-band relative overflow-x-clip bg-[#261F38] text-[#F4EFE6]"
      >
        <div
          aria-hidden="true"
          className="cursor-spotlight pointer-events-none absolute inset-0 z-0"
        />
        <div
          aria-hidden="true"
          className="cursor-spotlight-pattern pointer-events-none absolute inset-0 z-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 right-0 w-[520px] h-[520px] rounded-full blur-3xl opacity-35"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 176, 212, 0.16) 0%, rgba(82, 59, 125, 0.20) 50%, transparent 72%)',
          }}
        />

        <ScrollStage className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Backlit Editorial Figure */}
            <div className="lg:col-span-5 order-2 lg:order-1 flex items-center justify-center">
              <Reveal variant="figure-rise" className="w-full max-w-[410px]">
                <div className="relative w-full flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-full blur-3xl ambient-breathe"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(139, 176, 212, 0.30) 0%, rgba(82, 59, 125, 0.32) 50%, transparent 74%)',
                    }}
                  />
                  <div
                    className="relative z-10 w-full"
                    style={{
                      transform:
                        'translate3d(calc(var(--mx-norm, 0) * 7px), calc(var(--my-norm, 0) * 6px), 0)',
                    }}
                  >
                    <img
                      ref={story1ImgRef}
                      src="./images/story-depletion.webp"
                      alt="Иллюстрация истощения: сосуд с убывающей водой"
                      className="w-full h-auto object-contain select-none will-change-transform"
                      style={{
                        filter: 'drop-shadow(0 0 24px rgba(139, 176, 212, 0.22))',
                      }}
                    />
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right: Double Rule Kicker + Chapter Stamp + Concise Steps + Body Check */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-5">
              <div className="space-y-3">
                <Reveal variant="rule-draw">
                  <div className="gazette-double-top !pt-0" aria-hidden="true" />
                </Reveal>
                <div
                  ref={story1StampRef}
                  className="flex flex-wrap items-center justify-between gap-3 pt-1"
                >
                  <span className="type-kicker text-[#8BB0D4]">
                    Глава 01 · Как накапливается выгорание
                  </span>
                  <span
                    className={`gazette-stamp text-[#8BB0D4] ${
                      story1StampVisible ? 'slam' : 'opacity-0'
                    }`}
                  >
                    ПРОБЛЕМА
                  </span>
                </div>
              </div>

              <Reveal variant="clip-title">
                <h2 className="font-gazette-tall text-4xl sm:text-5xl lg:text-[54px] leading-[0.98] text-[#F4EFE6]">
                  ПОЧЕМУ УСТАЛОСТЬ НЕ ПРОХОДИТ ЗА ВЫХОДНЫЕ
                </h2>
              </Reveal>

              <Reveal variant="fade" delayMs={60}>
                <p className="font-editorial-body text-[16.5px] leading-[1.6] text-[#D6CFE0]">
                  Профессиональное истощение копится постепенно — при высокой
                  системной нагрузке и трёх повседневных механизмах, с которыми
                  базовый сон в одиночку уже не успевает справляться.
                </p>
              </Reveal>

              <div className="space-y-3.5 pt-1">
                {WHY_STEPS_PART1.map((step, idx) => (
                  <Reveal
                    key={step.num}
                    variant="slide-up"
                    delayMs={80 * idx}
                  >
                    <div className="flex items-start gap-3.5 border-t border-[#F4EFE6]/10 pt-3.5">
                      <span
                        className="font-gazette-mono text-[12.5px] font-bold text-[#8BB0D4] shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-[#8BB0D4]/10 border border-[#8BB0D4]/30"
                        style={{
                          boxShadow: '0 0 14px rgba(139, 176, 212, 0.22)',
                        }}
                      >
                        {step.num}
                      </span>
                      <p className="text-[15px] leading-[1.55] text-[#D6CFE0]/90">
                        <strong className="font-editorial text-[16.5px] text-[#F4EFE6] mr-1.5">
                          {step.title}.
                        </strong>
                        {step.text}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Tactile Micro-Interactive: 3-Second Body Check */}
              <Reveal variant="slide-up" delayMs={220}>
                <div className="mt-2 rounded-2xl bg-[#1F192E]/65 border border-[#F4EFE6]/12 p-4 sm:p-5 space-y-3">
                  <p className="type-kicker text-[#8BB0D4]">
                    Прямо сейчас проверьте три точки (нажмите, чтобы отпустить):
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {BODY_CHECK_POINTS.map((pt) => {
                      const isChecked = checkedPoints[pt.id];
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => handleTogglePoint(pt.id)}
                          aria-pressed={isChecked}
                          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[13.5px] font-medium whitespace-nowrap border transition-all duration-200 cursor-pointer min-h-[38px] ${
                            isChecked
                              ? 'bg-[#8BB0D4]/20 border-[#8BB0D4] text-[#F4EFE6] shadow-[0_0_16px_rgba(139,176,212,0.25)]'
                              : 'bg-[#F4EFE6]/[0.05] border-[#F4EFE6]/20 text-[#D6CFE0] hover:border-[#8BB0D4]/65 hover:text-[#F4EFE6] hover:bg-[#8BB0D4]/10'
                          }`}
                        >
                          {isChecked ? pt.doneLabel : pt.idleLabel}
                        </button>
                      );
                    })}
                  </div>

                  {currentHintText && (
                    <p
                      key={activePointHint}
                      className="font-editorial-italic text-[14px] text-[#D6CFE0]/90 animate-fade-in"
                    >
                      {currentHintText}
                    </p>
                  )}

                  {allBodyPointsChecked && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#F4EFE6]/10 animate-fade-in">
                      <span className="gazette-stamp slam text-[#8BB0D4]">
                        Готово · короткая пауза сделана
                      </span>
                      <button
                        type="button"
                        onClick={handleResetPoints}
                        className="text-[12.5px] text-[#D6CFE0]/70 hover:text-[#F4EFE6] underline underline-offset-4 cursor-pointer transition-colors"
                      >
                        Сбросить
                      </button>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </ScrollStage>
      </section>

      {/* ================================================================= */}
      {/* SMOOTH DAWN TRANSITION (#261F38 -> #EFE8DC)                       */}
      {/* ================================================================= */}
      <SectionBridge theme="dawn" label="Глава 02 · Переход к системе" />

      {/* ================================================================= */}
      {/* STORY SPREAD 2 (#story-restoration, #EFE8DC)                      */}
      {/* ================================================================= */}
      <section
        id="story-restoration"
        ref={story2SectionRef}
        className="scroll-mt-24 relative overflow-x-clip bg-[#EFE8DC] text-[#1C1629]"
      >
        <div
          aria-hidden="true"
          className="cursor-spotlight-light pointer-events-none absolute inset-0 z-0"
        />
        <div
          aria-hidden="true"
          className="cursor-spotlight-paper-grid pointer-events-none absolute inset-0 z-0"
        />

        <ScrollStage className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Editorial Copy Steps 04-05 + Pull-Quote + Violet CTA */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-3">
                <Reveal variant="rule-draw">
                  <div className="gazette-double-top !pt-0" aria-hidden="true" />
                </Reveal>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="type-kicker text-[#3D6A94]">
                    Глава 02 · Как выстроить восстановление
                  </span>
                  <span className="gazette-stamp text-[#523B7D]">
                    РЕШЕНИЕ
                  </span>
                </div>
              </div>

              <Reveal variant="clip-title">
                <h2 className="font-gazette-tall text-4xl sm:text-5xl lg:text-[54px] leading-[0.98] text-[#1C1629]">
                  ОТ РАЗРОЗНЕННЫХ СОВЕТОВ К СИСТЕМЕ
                </h2>
              </Reveal>

              <div className="space-y-4">
                {WHY_STEPS_PART2.map((step, idx) => (
                  <Reveal
                    key={step.num}
                    variant="slide-up"
                    delayMs={80 * idx}
                  >
                    <div className="flex items-start gap-3.5 border-t border-[#1C1629]/12 pt-4">
                      <span className="font-gazette-mono text-[12.5px] font-bold text-[#3D6A94] shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-[#E4EEF7] border border-[#B4CDE4]">
                        {step.num}
                      </span>
                      <p className="text-[15.5px] leading-[1.58] text-[#362E47]">
                        <strong className="font-editorial text-[17px] text-[#1C1629] mr-1.5">
                          {step.title}.
                        </strong>
                        {step.text}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Refined Editorial Pull-Quote */}
              <Reveal variant="slide-up" delayMs={160}>
                <blockquote className="rounded-r-2xl bg-[#ECE6F6]/55 border-l-[3px] border-[#523B7D] px-5 py-4 my-1">
                  <p className="font-editorial-italic text-[17.5px] sm:text-[18.5px] leading-[1.55] text-[#1C1629]">
                    «Устойчивость специалиста держится не на героическом
                    преодолении, а на коротких ритуалах возврата к себе,
                    встроенных в обычный рабочий день».
                  </p>
                </blockquote>
              </Reveal>

              <Reveal variant="fade" delayMs={200}>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('diagnostics')}
                    className="btn-violet inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold cursor-pointer min-h-[48px]"
                  >
                    <span>Перейти к самооценке</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Right: Large Daylight Restoration Figure */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <Reveal variant="figure-rise" className="w-full max-w-[420px]">
                <div className="relative w-full flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-4 rounded-full blur-3xl ambient-breathe"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(252, 249, 243, 0.95) 18%, rgba(228, 238, 247, 0.85) 50%, transparent 76%)',
                    }}
                  />
                  <img
                    ref={story2ImgRef}
                    src="./images/story-restoration.webp"
                    alt="Иллюстрация восстановления: росток и спокойные волны"
                    className="relative z-10 w-full h-auto object-contain select-none will-change-transform"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </ScrollStage>
      </section>
    </div>
  );
};
