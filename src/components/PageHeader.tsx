import type { ReactNode } from 'react';
import type { AppRoute } from './NavigationMenu';
import { NavigationMenu } from './NavigationMenu';

export function PageHeader({ title, activeRoute, onNavigate, onLock, examinerShortcode, actions }: {
  title: string;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  examinerShortcode?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-700 bg-app/95 shadow-sm">
      <div className="app-container flex min-h-16 items-center gap-3 py-2">
        <NavigationMenu activeRoute={activeRoute} examinerShortcode={examinerShortcode} onLock={onLock} onNavigate={onNavigate} />
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-white">{title}</h1>
        {actions}
      </div>
    </header>
  );
}