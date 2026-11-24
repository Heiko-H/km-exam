import type { AppRoute } from './NavigationMenu';
import { PageHeader } from './PageHeader';
import { useI18n } from '../i18n/I18nProvider';

export function Home({ activeRoute, onNavigate, onLock }: { activeRoute: AppRoute; onNavigate: (route: AppRoute) => void; onLock: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <PageHeader activeRoute={activeRoute} onLock={onLock} onNavigate={onNavigate} title={t('app.title')} />
      <main className="mx-auto max-w-5xl px-3 py-8 sm:px-6 sm:py-12">
        <h1 className="rounded-xl border border-slate-700 bg-panel p-6 text-2xl font-bold text-white text-center">{t('home.welcome')}</h1>
      </main>
    </>
  );
}