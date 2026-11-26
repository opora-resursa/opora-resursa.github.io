import React, { useEffect, useRef, useState } from 'react';

export type RevealVariant =
  | 'slide-up'
  | 'clip-title'
  | 'figure-rise'
  | 'rule-draw'
  | 'fade';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: RevealVariant;
}

const VARIANT_CLASSES: Record<
  RevealVariant,
  { hidden: string; visible: string }
> = {
  'slide-up': {
    hidden: 'reveal-slide-up-hidden',
    visible: 'reveal-slide-up-visible',
  },
  'clip-title': {
    hidden: 'reveal-clip-title-hidden',
    visible: 'reveal-clip-title-visible',
  },
  'figure-rise': {
    hidden: 'reveal-figure-rise-hidden',
    visible: 'reveal-figure-rise-visible',
  },
  'rule-draw': {
    hidden: 'reveal-rule-draw-hidden',
    visible: 'reveal-rule-draw-visible',
  },
  fade: {
    hidden: 'reveal-fade-hidden',
    visible: 'reveal-fade-visible',
  },
};

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delayMs = 0,
  variant = 'slide-up',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const isInOrAboveViewport = () =>
      node.getBoundingClientRect().top < window.innerHeight * 0.98;

    if (isInOrAboveViewport()) {
      setVisible(true);
      return;
    }

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setVisible(true);
      observer.disconnect();
      window.removeEventListener('scroll', onScrollCheck);
      window.removeEventListener('resize', onScrollCheck);
    };

    const onScrollCheck = () => {
      if (isInOrAboveViewport()) {
        reveal();
      }
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
      { threshold: 0.01, rootMargin: '0px 0px -12px 0px' }
    );

    observer.observe(node);
    window.addEventListener('scroll', onScrollCheck, { passive: true });
    window.addEventListener('resize', onScrollCheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScrollCheck);
      window.removeEventListener('resize', onScrollCheck);
    };
  }, []);

  const stateClass = visible
    ? VARIANT_CLASSES[variant].visible
    : `${VARIANT_CLASSES[variant].hidden} will-change-transform`;

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`reveal-base ${stateClass} ${className}`}
    >
      {children}
    </div>
  );
};

export function useScrollParallax(
  ref: React.RefObject<HTMLElement | null>,
  rangePx = 24,
  scaleRange = 0.045
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(pointer: coarse)').matches
    ) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const anchor = el.parentElement ?? el;
      const rect = anchor.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      const raw = (center - vh / 2) / (vh / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, raw));
      const offset = Number((clamped * rangePx).toFixed(2));
      const centrality = 1 - Math.abs(clamped);
      const scale = Number(
        (1 - scaleRange + centrality * scaleRange * 1.5).toFixed(4)
      );
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale})`;
    };

    const schedule = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      el.style.transform = '';
    };
  }, [ref, rangePx, scaleRange]);
}

export function useCursorSpotlight(
  ref: React.RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let curX = 0;
    let curY = 0;
    let curOp = 0;
    let targetX = 0;
    let targetY = 0;
    let targetOp = 0;
    let curNormX = 0;
    let curNormY = 0;
    let targetNormX = 0;
    let targetNormY = 0;

    const writeVars = () => {
      el.style.setProperty('--mx', `${curX.toFixed(1)}px`);
      el.style.setProperty('--my', `${curY.toFixed(1)}px`);
      el.style.setProperty('--spot-opacity', curOp.toFixed(3));
      el.style.setProperty('--mx-norm', curNormX.toFixed(4));
      el.style.setProperty('--my-norm', curNormY.toFixed(4));
    };

    const tick = () => {
      curX += (targetX - curX) * 0.13;
      curY += (targetY - curY) * 0.13;
      curOp += (targetOp - curOp) * 0.1;
      curNormX += (targetNormX - curNormX) * 0.13;
      curNormY += (targetNormY - curNormY) * 0.13;

      const dx = Math.abs(targetX - curX);
      const dy = Math.abs(targetY - curY);
      const dOp = Math.abs(targetOp - curOp);
      const dNorm = Math.max(
        Math.abs(targetNormX - curNormX),
        Math.abs(targetNormY - curNormY)
      );

      if (dx < 0.25 && dy < 0.25 && dOp < 0.005 && dNorm < 0.005) {
        curX = targetX;
        curY = targetY;
        curOp = targetOp;
        curNormX = targetNormX;
        curNormY = targetNormY;
        writeVars();
        rafId = 0;
        return;
      }

      writeVars();
      rafId = requestAnimationFrame(tick);
    };

    const startRaf = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const rect = el.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      const halfW = rect.width / 2 || 1;
      const halfH = rect.height / 2 || 1;
      targetNormX = Math.max(-1, Math.min(1, (targetX - halfW) / halfW));
      targetNormY = Math.max(-1, Math.min(1, (targetY - halfH) / halfH));
      targetOp = 1;

      if (curOp < 0.02) {
        curX = targetX;
        curY = targetY;
      }

      startRaf();
    };

    const onPointerLeave = () => {
      targetOp = 0;
      targetNormX = 0;
      targetNormY = 0;
      startRaf();
    };

    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerleave', onPointerLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.style.setProperty('--spot-opacity', '0');
      el.style.setProperty('--mx-norm', '0');
      el.style.setProperty('--my-norm', '0');
    };
  }, [ref]);
}

export const ScrollStage: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(pointer: coarse)').matches
    ) {
      return;
    }

    const anchor = anchorRef.current;
    const el = stageRef.current;
    if (!anchor || !el) return;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const rect = anchor.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const entryStart = vh * 0.98;
      const entryEnd = vh * 0.68;

      if (rect.top <= entryEnd) {
        el.style.transform = '';
        return;
      }

      const raw = (entryStart - rect.top) / (entryStart - entryEnd || 1);
      const clamped = Math.max(0, Math.min(1, raw));
      const eased = 1 - Math.pow(1 - clamped, 2);
      const translateY = ((1 - eased) * 22).toFixed(2);
      const scale = (0.982 + eased * 0.018).toFixed(4);
      el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    };

    const schedule = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      el.style.transform = '';
    };
  }, []);

  return (
    <div ref={anchorRef}>
      <div
        ref={stageRef}
        className={className}
        style={{ transformOrigin: 'center top' }}
      >
        {children}
      </div>
    </div>
  );
};

export const SectionBridge: React.FC<{
  theme?: 'dark' | 'light' | 'dawn' | 'dusk';
  label?: string;
  className?: string;
}> = ({ theme = 'light', label, className = '' }) => {
  const bridgeRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const node = bridgeRef.current;
    if (!node) return;

    const isInOrAboveViewport = () =>
      node.getBoundingClientRect().top < window.innerHeight * 0.96;

    if (isInOrAboveViewport()) {
      setVisible(true);
      return;
    }

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setVisible(true);
      observer.disconnect();
      window.removeEventListener('scroll', onScrollCheck);
      window.removeEventListener('resize', onScrollCheck);
    };

    const onScrollCheck = () => {
      if (isInOrAboveViewport()) {
        reveal();
      }
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
    window.addEventListener('resize', onScrollCheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScrollCheck);
      window.removeEventListener('resize', onScrollCheck);
    };
  }, []);

  const visibleAttr = visible ? 'true' : 'false';

  if (theme === 'dawn' || theme === 'dusk') {
    const background =
      theme === 'dawn'
        ? 'linear-gradient(180deg, #261F38 0%, #443B57 26%, #82788C 54%, #C8BEB2 80%, #EFE8DC 100%)'
        : 'linear-gradient(180deg, #F5F0E5 0%, #CFC5D4 26%, #7E728E 54%, #3E3354 80%, #1F192E 100%)';

    return (
      <div
        ref={bridgeRef}
        aria-hidden={!label}
        className={`relative w-full h-24 sm:h-32 flex items-center justify-center overflow-hidden ${className}`}
        style={{ background }}
      >
        <div className="w-full max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col items-center gap-2">
          <div className="w-full flex items-center gap-3">
            <div
              data-visible={visibleAttr}
              className="bridge-line flex-1 h-[1px] origin-right bg-gradient-to-r from-transparent via-[#F4EFE6]/45 to-[#8BB0D4]/85"
            />
            <span
              aria-hidden="true"
              data-visible={visibleAttr}
              className="bridge-diamond w-2 h-2 shrink-0 rounded-[1px] bg-[#F4EFE6] border border-[#8BB0D4] shadow-[0_0_14px_rgba(139,176,212,0.85)]"
            />
            <div
              data-visible={visibleAttr}
              className="bridge-line flex-1 h-[1px] origin-left bg-gradient-to-l from-transparent via-[#F4EFE6]/45 to-[#8BB0D4]/85"
            />
          </div>
          {label && (
            <span className="font-gazette-mono text-[10px] tracking-[0.14em] uppercase px-3 py-0.5 rounded-full bg-[#1F192E]/55 border border-[#F4EFE6]/18 text-[#F4EFE6]/95 backdrop-blur-[2px]">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (theme === 'dark') {
    return (
      <div
        ref={bridgeRef}
        aria-hidden={!label}
        className={`relative w-full py-5 sm:py-6 flex items-center justify-center overflow-hidden ${className}`}
        style={{
          background: 'linear-gradient(180deg, #1F192E 0%, #261F38 100%)',
        }}
      >
        <div className="w-full max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col items-center gap-2">
          <div className="w-full flex items-center gap-3">
            <div
              data-visible={visibleAttr}
              className="bridge-line flex-1 h-[1px] origin-right bg-gradient-to-r from-transparent via-[#8BB0D4]/25 to-[#8BB0D4]/65"
            />
            <span
              aria-hidden="true"
              data-visible={visibleAttr}
              className="bridge-diamond w-2 h-2 shrink-0 rounded-[1px] bg-[#8BB0D4] shadow-[0_0_12px_rgba(139,176,212,0.9)]"
            />
            <div
              data-visible={visibleAttr}
              className="bridge-line flex-1 h-[1px] origin-left bg-gradient-to-l from-transparent via-[#8BB0D4]/25 to-[#8BB0D4]/65"
            />
          </div>
          {label && (
            <span className="font-gazette-mono text-[10px] tracking-[0.14em] uppercase text-[#8BB0D4]/85">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={bridgeRef}
      aria-hidden={!label}
      className={`relative w-full py-4 sm:py-5 flex items-center justify-center overflow-hidden ${className}`}
    >
      <div className="w-full max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col items-center gap-1.5">
        <div className="w-full flex items-center gap-3">
          <div
            data-visible={visibleAttr}
            className="bridge-line flex-1 h-[1px] origin-right bg-gradient-to-r from-transparent via-[#523B7D]/20 to-[#523B7D]/45"
          />
          <span
            aria-hidden="true"
            data-visible={visibleAttr}
            className="bridge-diamond w-2 h-2 shrink-0 rounded-[1px] bg-[#8BB0D4]/65 border border-[#523B7D] shadow-[0_0_8px_rgba(82,59,125,0.28)]"
          />
          <div
            data-visible={visibleAttr}
            className="bridge-line flex-1 h-[1px] origin-left bg-gradient-to-l from-transparent via-[#3D6A94]/20 to-[#3D6A94]/45"
          />
        </div>
        {label && (
          <span className="font-gazette-mono text-[10px] tracking-[0.14em] uppercase text-[#615875]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
