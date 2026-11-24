import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSelect } from './LanguageSelect';

export type AppRoute = 'home' | 'random' | 'general' | 'techniques' | 'training' | 'refresh-data';

interface NavigationMenuProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
}

export function NavigationMenu({ activeRoute, onNavigate, onLock }: NavigationMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  function navigate(route: AppRoute) {
    setOpen(false);
    onNavigate(route);
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={t('nav.menu')}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-600 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary print:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-40 print:hidden" role="presentation">
          <button aria-label={t('modal.close')} className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} type="button" />
          <aside aria-label={t('nav.menu')} className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col border-r border-slate-700 bg-panel p-5 shadow-2xl">
            <header className="mb-6 flex items-center justify-between gap-4">
              <span className="font-semibold text-white">{t('app.title')}</span>
              <div className="flex items-center gap-2">
                <LanguageSelect />
                <button aria-label={t('modal.close')} className="rounded-md p-2 text-slate-300 hover:bg-slate-700" onClick={() => setOpen(false)} type="button">
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
            </header>
            <nav className="flex-1 space-y-1">
              <MenuButton active={activeRoute === 'home'} label={t('nav.home')} onClick={() => navigate('home')} />
              <MenuButton active={activeRoute === 'general'} label={t('nav.general')} onClick={() => navigate('general')} />
              <MenuButton active={activeRoute === 'random'} label={t('nav.random')} onClick={() => navigate('random')} />
              <MenuButton active={activeRoute === 'techniques'} label={t('nav.techniques')} onClick={() => navigate('techniques')} />
              <MenuButton active={activeRoute === 'training'} label={t('nav.training')} onClick={() => navigate('training')} />
              <MenuButton active={activeRoute === 'refresh-data'} label={t('nav.refreshData')} onClick={() => navigate('refresh-data')} />
            </nav>
            <button className="mt-5 min-h-11 rounded-md border border-slate-600 px-3 text-left font-medium text-slate-200 hover:bg-slate-700" onClick={() => { setOpen(false); onLock(); }} type="button">
              {t('nav.lock')}
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button aria-current={active ? 'page' : undefined} className={`min-h-11 w-full rounded-md px-3 text-left font-medium ${active ? 'bg-primary/15 text-primary' : 'text-slate-200 hover:bg-slate-700'}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}