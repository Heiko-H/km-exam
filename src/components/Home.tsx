import type { AppRoute } from './NavigationMenu';
import { PageHeader } from './PageHeader';
import { useI18n } from '../i18n/I18nProvider';

export function Home({ activeRoute, onNavigate, onLock, examinerShortcode }: { activeRoute: AppRoute; onNavigate: (route: AppRoute) => void; onLock: () => void; examinerShortcode?: string }) {
  const { t } = useI18n();
  return (
    <>
      <PageHeader activeRoute={activeRoute} examinerShortcode={examinerShortcode} onLock={onLock} onNavigate={onNavigate} title={t('app.title')} />
      <main className="app-container py-8 sm:py-12">
        <section className="space-y-4 rounded-xl border border-slate-700 bg-panel p-6 sm:p-8">
          <h1 className="text-center text-2xl font-bold text-white">{t('home.welcome')}</h1>
          <p className="mx-auto max-w-3xl text-center leading-relaxed text-slate-300">{t('home.lorem')}</p>
        </section>
      </main>
    </>
  );
}