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
            className="inline-flex items-center gap-2.5 cursor-pointer group rounded-lg px-1 -mx-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BB0D4]"
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

      {/* Ultra-Subtle Left Desktop Scroll-Progress Line (00-100, xl+ only) */}
      <aside
        aria-hidden="true"
        className="no-print hidden xl:flex fixed left-5 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2.5 pointer-events-none select-none"
      >
        <span
          className={`font-gazette-mono text-[10px] tracking-widest transition-colors duration-300 ${
            isDarkHeader ? 'text-[#D6CFE0]/70' : 'text-[#615875]/75'
          }`}
        >
          00
        </span>

        <div
          className={`relative w-[1.5px] h-40 rounded-full transition-colors duration-300 ${
            isDarkHeader ? 'bg-[#F4EFE6]/15' : 'bg-[#1C1629]/14'
          }`}
        >
          <div
            className="absolute top-0 left-0 w-full rounded-full transition-all duration-150"
            style={{
              height: `${scrollProgress}%`,
              background: isDarkHeader ? '#8BB0D4' : '#523B7D',
            }}
          />
          <span
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 rounded-[1px] transition-all duration-150"
            style={{
              top: `${scrollProgress}%`,
              background: isDarkHeader ? '#8BB0D4' : '#523B7D',
              boxShadow: isDarkHeader
                ? '0 0 10px rgba(139, 176, 212, 0.9)'
                : '0 0 8px rgba(82, 59, 125, 0.55)',
            }}
          />
        </div>

        <span
          className={`font-gazette-mono text-[10px] tracking-widest transition-colors duration-300 ${
            isDarkHeader ? 'text-[#8BB0D4]' : 'text-[#523B7D]'
          }`}
        >
          100
        </span>
      </aside>
    </>
  );
};
