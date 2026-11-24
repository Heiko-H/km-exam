import type { ReactNode } from 'react';
import type { AppRoute } from './NavigationMenu';
import { NavigationMenu } from './NavigationMenu';

export function PageHeader({ title, activeRoute, onNavigate, onLock, actions }: {
  title: string;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLock: () => void;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-700 bg-app/95 shadow-sm">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center gap-3 px-3 py-2 sm:px-6">
        <NavigationMenu activeRoute={activeRoute} onLock={onLock} onNavigate={onNavigate} />
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-white">{title}</h1>
        {actions}
      </div>
    </header>
  );
}