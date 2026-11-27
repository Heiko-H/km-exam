import type { AppRoute } from './NavigationMenu';
import { PageHeader } from './PageHeader';
import { useI18n } from '../i18n/I18nProvider';

export function Placeholder({ route, onNavigate, onLock }: { route: AppRoute; onNavigate: (route: AppRoute) => void; onLock: () => void }) {
  const { t } = useI18n();
  const isTraining = route === 'training';
  const title = isTraining ? t('placeholder.training') : t('placeholder.refreshData');
  return (
    <>
      <PageHeader activeRoute={route} onLock={onLock} onNavigate={onNavigate} title={title} />
      <main className="app-container py-8 sm:py-12">
        <p className="rounded-xl border border-slate-700 bg-panel p-6 text-slate-300">{t('placeholder.title')}</p>
      </main>
    </>
  );
}