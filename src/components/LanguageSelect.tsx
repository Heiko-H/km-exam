import { useEffect, useRef, useState } from 'react';
import type { Language } from '../lib/types';
import { useI18n } from '../i18n/I18nProvider';

const languages: { code: Language; name: string }[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
];

function Flag({ language }: { language: Language }) {
  const common = { width: 30, height: 20, viewBox: '0 0 30 20', className: 'rounded-sm border border-white/20' };
  if (language === 'de') return <svg {...common} aria-hidden="true"><rect width="30" height="20" fill="#ffce00" /><rect width="30" height="13.33" fill="#dd0000" /><rect width="30" height="6.67" /></svg>;
  if (language === 'fr') return <svg {...common} aria-hidden="true"><rect width="10" height="20" fill="#002395" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ed2939" /></svg>;
  if (language === 'it') return <svg {...common} aria-hidden="true"><rect width="10" height="20" fill="#009246" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ce2b37" /></svg>;
  if (language === 'es') return <svg {...common} aria-hidden="true"><rect width="30" height="20" fill="#aa151b" /><rect y="5" width="30" height="10" fill="#f1bf00" /></svg>;
  return (
    <svg {...common} aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="5" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="2" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="7" />
      <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3" />
    </svg>
  );
}

export function LanguageSelect() {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('language.select')}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-600 bg-panel px-2.5 text-sm text-slate-100 shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Flag language={language} />
        <span aria-hidden="true" className="text-xs">▾</span>
      </button>
      {open && (
        <div aria-label={t('language.select')} className="absolute right-0 mt-2 min-w-40 overflow-hidden rounded-lg border border-slate-600 bg-panel p-1 shadow-xl" role="listbox">
          {languages.map((item) => (
            <button
              aria-selected={language === item.code}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${language === item.code ? 'bg-primary/20 text-white' : 'text-slate-200 hover:bg-slate-700'}`}
              key={item.code}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <Flag language={item.code} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}