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
  rangePx = 24
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
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
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
  }, [ref, rangePx]);
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
    let lastX = 0;
    let lastY = 0;

    const apply = () => {
      rafId = 0;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(lastX - rect.left).toFixed(1)}px`);
      el.style.setProperty('--my', `${(lastY - rect.top).toFixed(1)}px`);
      el.style.setProperty('--spot-opacity', '1');
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(apply);
      }
    };

    const onPointerLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      el.style.setProperty('--spot-opacity', '0');
    };

    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerleave', onPointerLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.style.setProperty('--spot-opacity', '0');
    };
  }, [ref]);
}
