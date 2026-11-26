import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppState } from '../types/app';
import {
  Reveal,
  ScrollStage,
  SectionBridge,
  useCursorSpotlight,
} from './Reveal';

interface LocalProfileFooterProps {
  state: AppState;
  onRestoreBackup: (jsonString: string) => void;
  onResetAllData: () => void;
  onOpenPrintPreview: () => void;
}

export const LocalProfileFooter: React.FC<LocalProfileFooterProps> = ({
  state,
  onRestoreBackup,
  onResetAllData,
  onOpenPrintPreview,
}) => {
  const footerRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useCursorSpotlight(footerRef);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleExportJson = () => {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `opora-resursa-backup-${localDate}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onRestoreBackup(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearClick = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    if (!confirmReset) {
      setConfirmReset(true);
      resetTimerRef.current = window.setTimeout(() => {
        setConfirmReset(false);
        resetTimerRef.current = null;
      }, 5000);
      return;
    }
    setConfirmReset(false);
    onResetAllData();
  };

  return (
    <>
      <SectionBridge
        theme="dusk"
        label="Приватность и памятка"
        className="no-print"
      />
      <footer
        id="profile"
        ref={footerRef}
        className="no-print scroll-mt-24 on-dark-band relative overflow-x-clip bg-[#1F192E] text-[#F4EFE6]"
      >
        {/* Balanced dual soft spotlights + cursor spotlight */}
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
          className="pointer-events-none -left-24 -top-20 absolute h-96 w-96 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(107, 80, 158, 0.34) 0%, rgba(82, 59, 125, 0.14) 50%, transparent 72%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none -right-24 -bottom-24 absolute h-96 w-96 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 176, 212, 0.28) 0%, rgba(61, 106, 148, 0.14) 50%, transparent 72%)',
          }}
        />

        <ScrollStage>
          <Reveal variant="slide-up">
        <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-16 space-y-8">
          {/* Newspaper Top Double Rule */}
          <div className="gazette-double-top pt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="type-kicker text-[#8BB0D4]">
              Раздел 04 · Ваши записи и приватность
            </span>
            <span className="type-kicker text-[#D6CFE0]/75">
              Без регистрации и серверов
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <h2 className="font-gazette-tall text-3xl sm:text-4xl lg:text-[44px] leading-[0.98] text-[#F4EFE6]">
                СОХРАННОСТЬ ЗАПИСЕЙ И ПАМЯТКА
              </h2>

              <p className="text-[15.5px] leading-[1.65] text-[#D6CFE0] max-w-xl">
                Все оценки, листы и трекер хранятся только в памяти вашего
                браузера — к ним нет доступа ни у кого со стороны. Вы можете
                распечатать план в PDF или сохранить резервную копию файлом для
                переноса на другое устройство. На общем рабочем компьютере после
                завершения нажмите «Очистить данные».
              </p>
            </div>

            <div className="lg:col-span-6 rounded-2xl bg-[#261F38]/85 border border-[#F4EFE6]/12 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onOpenPrintPreview}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold bg-[#F4EFE6] text-[#1F192E] transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(244,239,230,0.42)] min-h-[44px] cursor-pointer whitespace-nowrap"
                >
                  <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>PDF-памятка</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4EFE6]/8 border border-[#F4EFE6]/25 text-[#F4EFE6] px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:border-[#8BB0D4] hover:bg-[#8BB0D4]/15 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(139,176,212,0.32)] min-h-[44px] cursor-pointer whitespace-nowrap"
                >
                  <Download className="h-4 w-4 shrink-0 text-[#8BB0D4]" aria-hidden="true" />
                  <span>Сохранить (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4EFE6]/8 border border-[#F4EFE6]/25 text-[#F4EFE6] px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:border-[#CBBEE4] hover:bg-[#523B7D]/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(107,80,158,0.38)] min-h-[44px] cursor-pointer whitespace-nowrap"
                >
                  <Upload className="h-4 w-4 shrink-0 text-[#D6CFE0]" aria-hidden="true" />
                  <span>Восстановить (.json)</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  tabIndex={-1}
                  className="sr-only"
                  aria-label="Загрузить резервную копию профиля JSON"
                />

                <button
                  type="button"
                  onClick={handleClearClick}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 min-h-[44px] cursor-pointer whitespace-nowrap ${
                    confirmReset
                      ? 'border-red-300 bg-red-600/85 text-white shadow-[0_0_22px_rgba(239,68,68,0.45)]'
                      : 'bg-[#F4EFE6]/5 border-[#F4EFE6]/20 text-[#D6CFE0] hover:border-red-300/65 hover:bg-red-500/20 hover:text-white hover:shadow-[0_0_18px_rgba(239,68,68,0.28)]'
                  }`}
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {confirmReset ? 'Подтвердить удаление?' : 'Очистить данные'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#F4EFE6]/12 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#D6CFE0]/75">
            <p>
              Опора ресурса · Система саморегуляции и профилактики эмоционального
              выгорания
            </p>
            <p>
              Не заменяет очную медицинскую или психотерапевтическую помощь при
              выраженном истощении.
            </p>
          </div>
        </div>
        </Reveal>
        </ScrollStage>
      </footer>
    </>
  );
};
