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
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-gazette-tall text-3xl sm:text-4xl lg:text-[44px] leading-[1.14] text-[#F4EFE6]">
                ВАШИ ЗАПИСИ И ПАМЯТКА
              </h2>

              <p className="text-[15.5px] leading-[1.65] text-[#D6CFE0] max-w-xl">
                Без регистрации: все тесты, листы и трекер хранятся только в
                этом браузере. Если вы меняете устройство или чистите браузер,
                скачайте файл записей — потом его можно загрузить обратно одним
                кликом. На общем рабочем ПК после работы нажмите «Очистить всё».
              </p>
            </div>

            <div className="lg:col-span-7 rounded-2xl bg-[#261F38]/85 border border-[#F4EFE6]/12 p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onOpenPrintPreview}
                  className="group flex items-start gap-3 rounded-xl px-4 py-3 text-left bg-[#F4EFE6] text-[#1F192E] transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(244,239,230,0.42)] min-h-[60px] cursor-pointer"
                >
                  <Printer className="h-4 w-4 shrink-0 mt-0.5 text-[#523B7D]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug">
                      Памятка в PDF
                    </span>
                    <span className="block text-[12px] text-[#362E47]/85 leading-snug mt-0.5">
                      Распечатать или сохранить план
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="group flex items-start gap-3 rounded-xl px-4 py-3 text-left bg-[#F4EFE6]/8 border border-[#F4EFE6]/25 text-[#F4EFE6] transition-all duration-200 hover:border-[#8BB0D4] hover:bg-[#8BB0D4]/15 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(139,176,212,0.32)] min-h-[60px] cursor-pointer"
                >
                  <Download className="h-4 w-4 shrink-0 mt-0.5 text-[#8BB0D4]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug">
                      Скачать файл записей
                    </span>
                    <span className="block text-[12px] text-[#D6CFE0]/80 leading-snug mt-0.5">
                      Чтобы перенести на другой ПК
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex items-start gap-3 rounded-xl px-4 py-3 text-left bg-[#F4EFE6]/8 border border-[#F4EFE6]/25 text-[#F4EFE6] transition-all duration-200 hover:border-[#CBBEE4] hover:bg-[#523B7D]/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(107,80,158,0.38)] min-h-[60px] cursor-pointer"
                >
                  <Upload className="h-4 w-4 shrink-0 mt-0.5 text-[#CBBEE4]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug">
                      Загрузить свои записи
                    </span>
                    <span className="block text-[12px] text-[#D6CFE0]/80 leading-snug mt-0.5">
                      Вернуть из сохранённого файла
                    </span>
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  tabIndex={-1}
                  className="sr-only"
                  aria-label="Загрузить сохранённый файл записей"
                />

                <button
                  type="button"
                  onClick={handleClearClick}
                  className={`group flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 min-h-[60px] cursor-pointer ${
                    confirmReset
                      ? 'border-red-300 bg-red-600/85 text-white shadow-[0_0_22px_rgba(239,68,68,0.45)]'
                      : 'bg-[#F4EFE6]/5 border-[#F4EFE6]/20 text-[#D6CFE0] hover:border-red-300/65 hover:bg-red-500/20 hover:text-white hover:shadow-[0_0_18px_rgba(239,68,68,0.28)]'
                  }`}
                >
                  <Trash2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug">
                      {confirmReset ? 'Подтвердить удаление?' : 'Очистить всё'}
                    </span>
                    <span
                      className={`block text-[12px] leading-snug mt-0.5 ${
                        confirmReset ? 'text-white/90' : 'text-[#D6CFE0]/75'
                      }`}
                    >
                      {confirmReset
                        ? 'Нажмите ещё раз для удаления'
                        : 'Стереть с этого устройства'}
                    </span>
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
