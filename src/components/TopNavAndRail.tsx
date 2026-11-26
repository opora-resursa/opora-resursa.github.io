import React, { useEffect, useState } from 'react';
import { Menu, Wind, X } from 'lucide-react';

export type SectionId =
  | 'top'
  | 'story'
  | 'story-restoration'
  | 'diagnostics'
  | 'catalog'
  | 'tracker'
  | 'profile';

const NAV_LINKS: { id: SectionId; label: string }[] = [
  { id: 'story', label: 'О программе' },
  { id: 'diagnostics', label: 'Самооценка' },
  { id: 'catalog', label: '30 методик' },
  { id: 'tracker', label: 'Трекер' },
];

const MOBILE_LINKS: { id: SectionId; label: string }[] = [
  { id: 'top', label: 'Начало' },
  { id: 'story', label: 'О программе' },
  { id: 'diagnostics', label: 'Самооценка' },
  { id: 'catalog', label: '30 методик' },
  { id: 'tracker', label: 'Трекер' },
  { id: 'profile', label: 'Памятка PDF' },
];

const RAIL_SLIDES: { id: SectionId; label: string }[] = [
  { id: 'top', label: 'Обложка' },
  { id: 'story', label: 'Проблема' },
  { id: 'story-restoration', label: 'Подход' },
  { id: 'diagnostics', label: 'Самооценка' },
  { id: 'catalog', label: '30 методик' },
  { id: 'tracker', label: 'Трекер' },
];

export function useActiveSection(): {
  activeSection: SectionId;
  navigateToSection: (id: SectionId) => void;
  scrollProgress: number;
  isDarkHeader: boolean;
} {
  const [activeSection, setActiveSection] = useState<SectionId>('top');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDarkHeader, setIsDarkHeader] = useState(true);

  useEffect(() => {
    const ids: SectionId[] = [
      'top',
      'story',
      'story-restoration',
      'diagnostics',
      'catalog',
      'tracker',
      'profile',
    ];

    const update = () => {
      const scrollY = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        docHeight > 0
          ? Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)))
          : 0;
      setScrollProgress(pct);

      const restorationEl = document.getElementById('story-restoration');
      const profileEl = document.getElementById('profile');
      const restorationTop = restorationEl
        ? restorationEl.getBoundingClientRect().top
        : Infinity;
      const profileTop = profileEl
        ? profileEl.getBoundingClientRect().top
        : Infinity;

      const atBottom = docHeight > 0 && scrollY >= docHeight - 24;
      const overDarkCoverOrSpread1 = restorationTop > 64;
      const overDarkFooter =
        Boolean(profileEl) &&
        (profileTop <= 64 || (atBottom && profileTop < window.innerHeight));
      setIsDarkHeader(overDarkCoverOrSpread1 || overDarkFooter);

      if (scrollY < 120) {
        setActiveSection('top');
        return;
      }

      if (atBottom && profileEl && profileTop < window.innerHeight) {
        setActiveSection('profile');
        return;
      }

      const viewportMid = window.innerHeight * 0.34;
      let current: SectionId = 'top';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= viewportMid) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    let rafId = 0;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const navigateToSection = (id: SectionId) => {
    setActiveSection(id);
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReduced ? 'auto' : 'smooth';

    if (id === 'top') {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior, block: 'start' });
  };

  return { activeSection, navigateToSection, scrollProgress, isDarkHeader };
}

interface TopNavAndRailProps {
  activeSection: SectionId;
  onNavigate: (id: SectionId) => void;
  onOpenQuickSos: () => void;
  scrollProgress: number;
  isDarkHeader: boolean;
}

export const TopNavAndRail: React.FC<TopNavAndRailProps> = ({
  activeSection,
  onNavigate,
  onOpenQuickSos,
  scrollProgress,
  isDarkHeader,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleMobileJump = (id: SectionId) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <header
        className={`no-print fixed top-0 inset-x-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
          isDarkHeader
            ? 'bg-[#1F192E]/88 border-[#F4EFE6]/10 text-[#F4EFE6]'
            : 'bg-[#FCF9F3]/92 border-[#1C1629]/10 text-[#1C1629]'
        }`}
      >
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand with subtle glowing sky-blue diamond */}
          <button
            type="button"
            onClick={() => onNavigate('top')}
            className={`inline-flex items-center gap-2.5 cursor-pointer group rounded-lg px-1 -mx-1 py-1 focus:outline-none focus-visible:ring-2 ${
              isDarkHeader
                ? 'focus-visible:ring-[#8BB0D4]'
                : 'focus-visible:ring-[#523B7D]'
            }`}
          >
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-[#8BB0D4] shadow-[0_0_12px_rgba(139,176,212,0.8)] transition-transform duration-200 group-hover:scale-110"
            />
            <span className="font-masthead-title text-[18px] sm:text-[19px] whitespace-nowrap tracking-tight">
              Опора ресурса
            </span>
          </button>

          {/* Center: 4 Clean Links */}
          <nav
            aria-label="Основные разделы"
            className="hidden md:flex items-center gap-7"
          >
            {NAV_LINKS.map((item) => {
              const isActive =
                activeSection === item.id ||
                (item.id === 'story' && activeSection === 'story-restoration');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`relative py-1.5 text-[14.5px] font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 ${
                    isDarkHeader
                      ? isActive
                        ? 'text-[#8BB0D4]'
                        : 'text-[#D6CFE0] hover:text-[#F4EFE6]'
                      : isActive
                      ? 'text-[#523B7D] font-semibold'
                      : 'text-[#362E47] hover:text-[#523B7D]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full ${
                        isDarkHeader ? 'bg-[#8BB0D4]' : 'bg-[#523B7D]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Tactile "Пауза 2 мин" + Mobile Menu */}
          <div className="flex items-center gap-2 pr-1 md:pr-0">
            <button
              type="button"
              onClick={onOpenQuickSos}
              className="btn-violet rounded-xl px-3.5 sm:px-4 py-2 text-[13px] sm:text-[13.5px] font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[40px]"
            >
              <span
                aria-hidden="true"
                className="breath-dot w-2 h-2 rounded-full bg-[#8BB0D4] shadow-[0_0_8px_rgba(139,176,212,0.85)] shrink-0"
              />
              <Wind className="w-4 h-4 text-[#8BB0D4] shrink-0" aria-hidden="true" />
              <span>Пауза 2 мин</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileMenuOpen}
              className={`md:hidden inline-flex items-center justify-center rounded-xl mr-0.5 min-w-[44px] min-h-[44px] cursor-pointer transition-colors ${
                isDarkHeader
                  ? 'bg-[#F4EFE6]/10 text-[#F4EFE6] hover:bg-[#F4EFE6]/18'
                  : 'bg-[#EFE8DC] text-[#1C1629] hover:bg-[#E5DDD0]'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Clean Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Мобильная навигация"
            className={`md:hidden px-5 pb-4 pt-2 flex flex-col gap-1.5 border-t ${
              isDarkHeader
                ? 'bg-[#1F192E]/96 border-[#F4EFE6]/10'
                : 'bg-[#FCF9F3]/96 border-[#1C1629]/10'
            }`}
          >
            {MOBILE_LINKS.map((item) => {
              const isActive =
                activeSection === item.id ||
                (item.id === 'story' && activeSection === 'story-restoration');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMobileJump(item.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium cursor-pointer transition-colors min-h-[44px] ${
                    isDarkHeader
                      ? isActive
                        ? 'bg-[#F4EFE6]/14 text-[#8BB0D4]'
                        : 'text-[#F4EFE6]/85 hover:bg-[#F4EFE6]/8'
                      : isActive
                      ? 'bg-[#ECE6F6] text-[#38255C] font-semibold'
                      : 'text-[#1C1629] hover:bg-[#EFE8DC]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Interactive Left Desktop Slide Navigation Rail (xl+ only) */}
      <aside
        aria-label="Навигация по слайдам"
        className="no-print hidden xl:flex fixed left-5 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-3 select-none"
      >
        <div className="relative flex flex-col items-center gap-2.5 py-1">
          <div
            aria-hidden="true"
            className={`absolute top-2.5 bottom-2.5 left-1/2 -translate-x-1/2 w-[1px] transition-colors duration-300 ${
              isDarkHeader ? 'bg-[#F4EFE6]/16' : 'bg-[#1C1629]/14'
            }`}
          />
          {RAIL_SLIDES.map((slide) => {
            const isActive = activeSection === slide.id;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => onNavigate(slide.id)}
                aria-label={slide.label}
                aria-current={isActive ? 'location' : undefined}
                className={`group relative flex items-center justify-center w-6 h-6 cursor-pointer focus:outline-none focus-visible:ring-2 rounded-full ${
                  isDarkHeader
                    ? 'focus-visible:ring-[#8BB0D4]'
                    : 'focus-visible:ring-[#523B7D]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`relative z-10 w-2 h-2 rotate-45 rounded-[1px] border transition-all duration-200 ${
                    isDarkHeader
                      ? isActive
                        ? 'bg-[#8BB0D4] border-[#8BB0D4] scale-125 shadow-[0_0_10px_rgba(139,176,212,0.9)]'
                        : 'bg-[#1F192E] border-[#D6CFE0]/45 group-hover:border-[#8BB0D4] group-hover:bg-[#8BB0D4]/30 group-hover:scale-110'
                      : isActive
                      ? 'bg-[#523B7D] border-[#523B7D] scale-125 shadow-[0_0_8px_rgba(82,59,125,0.55)]'
                      : 'bg-[#EFE8DC] border-[#615875]/45 group-hover:border-[#523B7D] group-hover:bg-[#523B7D]/20 group-hover:scale-110'
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 ${
                    isDarkHeader
                      ? 'bg-[#261F38]/95 text-[#F4EFE6] border border-[#8BB0D4]/30 shadow-[0_6px_18px_rgba(10,6,20,0.38)]'
                      : 'bg-[#FCF9F3]/95 text-[#1C1629] border border-[#523B7D]/25 shadow-[0_6px_16px_rgba(28,22,41,0.12)]'
                  }`}
                >
                  {slide.label}
                </span>
              </button>
            );
          })}
        </div>

        <span
          className={`font-gazette-mono text-[10px] tracking-widest transition-colors duration-300 ${
            isDarkHeader ? 'text-[#8BB0D4]' : 'text-[#523B7D]'
          }`}
        >
          {String(scrollProgress).padStart(2, '0')}%
        </span>
      </aside>
    </>
  );
};
