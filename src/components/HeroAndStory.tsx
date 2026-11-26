import React from 'react';
import { ArrowDown, ArrowRight, Wind } from 'lucide-react';
import { Reveal } from './Reveal';
import { SectionId } from './TopNavAndRail';

interface HeroAndStoryProps {
  onOpenQuickSos: () => void;
  onNavigate: (id: SectionId) => void;
}

const WHY_STEPS_PART1 = [
  {
    num: '01',
    title: 'Скрытая эмоциональная нагрузка',
    text: 'Рабочий день состоит не только из профессиональных задач: приходится постоянно сопереживать, сдерживать собственные реакции и выдерживать чужую тревогу.',
  },
  {
    num: '02',
    title: 'Тело остаётся в напряжении',
    text: 'Даже после конца смены плечи и челюсть остаются зажатыми, а мысли продолжают возвращаться к трудным разговорам и рабочим случаям.',
  },
  {
    num: '03',
    title: 'Выходных перестаёт хватать',
    text: 'Когда расход сил неделями превышает восстановление, пассивный отдых у экрана уже не возвращает чувство бодрости.',
  },
];

const WHY_STEPS_PART2 = [
  {
    num: '04',
    title: 'Короткие паузы в течение смены',
    text: 'Между приёмами, уроками и отчётами нет часа на длинную практику. Снижать напряжение прямо в рабочем ритме помогают техники на 2–5 минут, встроенные в обычный перерыв.',
  },
  {
    num: '05',
    title: 'Навык вместо случайных советов',
    text: 'Разовые рекомендации быстро забываются в спешке. Устойчивый эффект даёт понятная система: заметить зону перегрузки, подобрать подходящую практику и закрепить её как привычку.',
  },
];

const HERO_ROADMAP: { num: string; title: string; subtitle: string; target: SectionId }[] = [
  {
    num: '01 · Оценка (2 мин)',
    title: 'Экспресс-самооценка',
    subtitle: 'Покажет, где сейчас выше всего нагрузка',
    target: 'diagnostics',
  },
  {
    num: '02 · 30 методик',
    title: 'Библиотека методик',
    subtitle: 'Тренажёры дыхания, тела, мыслей и границ',
    target: 'catalog',
  },
  {
    num: '03 · Трекер недели',
    title: 'План восстановления',
    subtitle: 'Поможет закрепить короткие паузы в графике',
    target: 'tracker',
  },
];

export const HeroAndStory: React.FC<HeroAndStoryProps> = ({
  onOpenQuickSos,
  onNavigate,
}) => {
  return (
    <div className="no-print">
      {/* ================================================================= */}
      {/* COVER / HERO (#top, #1F192E)                                      */}
      {/* ================================================================= */}
      <section
        id="top"
        className="scroll-mt-24 relative overflow-x-clip bg-[#1F192E] text-[#F4EFE6]"
      >
        {/* Whisper-quiet radial ambient lighting & ultra-faint vertical hairlines */}
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

        <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
          {/* Subtle Newspaper Masthead Hairline Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-1.5 py-2.5 mb-10 sm:mb-14 border-y border-[#F4EFE6]/12 text-center">
            <span className="sm:text-left font-gazette-mono text-[10px] uppercase tracking-[0.14em] text-[#D6CFE0]/75">
              № 01 · ПСИХОГИГИЕНА
            </span>
            <span className="font-editorial-italic text-[13px] text-[#F4EFE6]/85">
              Опора ресурса
            </span>
            <span className="sm:text-right font-gazette-mono text-[10px] uppercase tracking-[0.14em] text-[#8BB0D4]/85">
              30 МЕТОДИК САМОРЕГУЛЯЦИИ
            </span>
          </div>

          {/* Spacious 2-Column Cover Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
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

              <p className="text-[16.5px] leading-[1.65] text-[#D6CFE0] max-w-xl">
                Короткие техники саморегуляции, экспресс-самооценка состояния и
                личный трекер восстановления — без регистрации и лишнего шума.
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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('story')}
                  className="inline-flex items-center gap-2 text-[14px] text-[#D6CFE0]/80 hover:text-[#8BB0D4] cursor-pointer transition-colors"
                >
                  <span>Как устроена программа</span>
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right: Large Seamless Illuminated Editorial Figure */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-[420px] flex items-center justify-center">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 rounded-full blur-3xl ambient-breathe"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(139, 176, 212, 0.28) 0%, rgba(107, 80, 158, 0.34) 48%, transparent 74%)',
                  }}
                />
                <img
                  src="./images/hero-equilibrium.jpg"
                  alt="Тонкие линии равновесия и ветвь на глубоком фиолетовом фоне"
                  className="relative z-10 w-full h-auto object-contain editorial-mask select-none"
                />
              </div>
            </div>
          </div>

          {/* 3-Step Roadmap Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 pt-8 border-t border-[#F4EFE6]/12">
            {HERO_ROADMAP.map((item) => (
              <button
                key={item.num}
                type="button"
                onClick={() => onNavigate(item.target)}
                className="group bg-[#F4EFE6]/[0.04] border border-[#F4EFE6]/10 rounded-2xl p-4 text-left transition-all hover:border-[#8BB0D4]/55 hover:bg-[#8BB0D4]/[0.08] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(139,176,212,0.18)] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-gazette-mono text-[11px] uppercase tracking-[0.11em] text-[#8BB0D4]">
                    {item.num}
                  </span>
                  <ArrowRight
                    className="w-3.5 h-3.5 text-[#8BB0D4]/70 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#8BB0D4]"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-editorial text-[17px] leading-snug text-[#F4EFE6] mb-1">
                  {item.title}
                </p>
                <p className="text-[13.5px] leading-snug text-[#D6CFE0]/90 group-hover:text-[#F4EFE6] transition-colors">
                  {item.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* STORY SPREAD 1 (#story, #261F38)                                  */}
      {/* ================================================================= */}
      <section
        id="story"
        className="scroll-mt-24 on-dark-band relative overflow-x-clip bg-[#261F38] text-[#F4EFE6]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 right-0 w-[520px] h-[520px] rounded-full blur-3xl opacity-35"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 176, 212, 0.16) 0%, rgba(82, 59, 125, 0.20) 50%, transparent 72%)',
          }}
        />

        <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left: Backlit Editorial Figure */}
              <div className="lg:col-span-5 order-2 lg:order-1 flex items-center justify-center">
                <div className="relative w-full max-w-[410px] flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-full blur-3xl ambient-breathe"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(139, 176, 212, 0.30) 0%, rgba(82, 59, 125, 0.32) 50%, transparent 74%)',
                    }}
                  />
                  <img
                    src="./images/story-depletion.jpg"
                    alt="Иллюстрация истощения: сосуд с убывающей водой"
                    className="relative z-10 w-full h-auto object-contain editorial-mask select-none"
                  />
                </div>
              </div>

              {/* Right: Double Rule Kicker + Chapter Stamp + Drop-Cap + Steps 01-03 */}
              <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
                <div className="gazette-double-top pt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="type-kicker text-[#8BB0D4]">
                    Глава 01 · Как накапливается выгорание
                  </span>
                  <span className="gazette-stamp text-[#8BB0D4]">
                    ПРОБЛЕМА
                  </span>
                </div>

                <h2 className="font-gazette-tall text-4xl sm:text-5xl lg:text-[54px] leading-[0.98] text-[#F4EFE6]">
                  ПОЧЕМУ УСТАЛОСТЬ НЕ ПРОХОДИТ ЗА ВЫХОДНЫЕ
                </h2>

                <p className="font-editorial-body text-[17px] leading-[1.7] text-[#D6CFE0]">
                  <span className="drop-cap" aria-hidden="true">Е</span>
                  <span className="sr-only">Е</span>сли к вечеру пятницы кажется, что достаточно просто
                  выспаться, а в понедельник напряжение возвращается ещё до
                  первого приёма, дело не в нехватке силы воли. Профессиональное
                  истощение формируется постепенно через три скрытых механизма.
                </p>

                <div className="space-y-5 pt-2">
                  {WHY_STEPS_PART1.map((step) => (
                    <div
                      key={step.num}
                      className="flex items-start gap-4 border-t border-[#F4EFE6]/10 pt-4"
                    >
                      <span
                        className="font-gazette-mono text-[13px] font-bold text-[#8BB0D4] shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-[#8BB0D4]/10 border border-[#8BB0D4]/30"
                        style={{
                          boxShadow: '0 0 14px rgba(139, 176, 212, 0.22)',
                        }}
                      >
                        {step.num}
                      </span>
                      <div className="space-y-1">
                        <h3 className="font-editorial text-[18px] text-[#F4EFE6]">
                          {step.title}
                        </h3>
                        <p className="text-[15px] leading-[1.6] text-[#D6CFE0]/90">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SMOOTH DAWN TRANSITION (#261F38 -> #EFE8DC)                       */}
      {/* ================================================================= */}
      <div
        aria-hidden="true"
        className="h-24 sm:h-32 w-full"
        style={{
          background:
            'linear-gradient(180deg, #261F38 0%, #443B57 26%, #82788C 54%, #C8BEB2 80%, #EFE8DC 100%)',
        }}
      />

      {/* ================================================================= */}
      {/* STORY SPREAD 2 (#story-restoration, #EFE8DC)                      */}
      {/* ================================================================= */}
      <section
        id="story-restoration"
        className="scroll-mt-24 relative overflow-x-clip bg-[#EFE8DC] text-[#1C1629]"
      >
        <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left: Editorial Copy Steps 04-05 + Pull-Quote + Violet CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div className="gazette-double-top pt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="type-kicker text-[#3D6A94]">
                    Глава 02 · Как выстроить восстановление
                  </span>
                  <span className="gazette-stamp text-[#523B7D]">
                    РЕШЕНИЕ
                  </span>
                </div>

                <h2 className="font-gazette-tall text-4xl sm:text-5xl lg:text-[54px] leading-[0.98] text-[#1C1629]">
                  ОТ РАЗРОЗНЕННЫХ СОВЕТОВ К СИСТЕМЕ
                </h2>

                <div className="space-y-5">
                  {WHY_STEPS_PART2.map((step) => (
                    <div
                      key={step.num}
                      className="flex items-start gap-4 border-t border-[#1C1629]/12 pt-4"
                    >
                      <span className="font-gazette-mono text-[13px] font-bold text-[#3D6A94] shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-[#E4EEF7] border border-[#B4CDE4]">
                        {step.num}
                      </span>
                      <div className="space-y-1">
                        <h3 className="font-editorial text-[18px] text-[#1C1629]">
                          {step.title}
                        </h3>
                        <p className="text-[15.5px] leading-[1.62] text-[#362E47]">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Refined Editorial Pull-Quote */}
                <blockquote className="rounded-r-2xl bg-[#ECE6F6]/55 border-l-[3px] border-[#523B7D] px-5 py-4 my-2">
                  <p className="font-editorial-italic text-[17.5px] sm:text-[18.5px] leading-[1.55] text-[#1C1629]">
                    «Устойчивость специалиста держится не на героическом
                    преодолении, а на коротких ритуалах возврата к себе,
                    встроенных в обычный рабочий день».
                  </p>
                </blockquote>

                <p className="text-[14.5px] leading-[1.6] text-[#615875]">
                  Техники саморегуляции не отменяют системных перегрузок и не
                  заменяют пересмотр расписания или отпуск, но помогают беречь
                  собственные силы там, где на нагрузку нельзя повлиять прямо
                  сейчас.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('diagnostics')}
                    className="btn-violet inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold cursor-pointer min-h-[48px]"
                  >
                    <span>Перейти к самооценке</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Right: Large Daylight Restoration Figure */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="relative w-full max-w-[420px] flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-4 rounded-full blur-3xl ambient-breathe"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(252, 249, 243, 0.95) 18%, rgba(228, 238, 247, 0.85) 50%, transparent 76%)',
                    }}
                  />
                  <img
                    src="./images/story-restoration.jpg"
                    alt="Иллюстрация восстановления: росток и спокойные волны"
                    className="relative z-10 w-full h-auto object-contain mix-blend-multiply editorial-mask select-none"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
