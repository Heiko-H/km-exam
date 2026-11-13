import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const [registered, setRegistered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const updateRef = useRef<{ url: string; registration: ServiceWorkerRegistration } | null>(null);
  const onRegisteredSW = useCallback((url: string, registration: ServiceWorkerRegistration | undefined) => {
    if (!registration) return;
    updateRef.current = { url, registration };
    setRegistered(true);
  }, []);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW,
  });

  useEffect(() => {
    if (!registered) return;

    let checking = false;
    const checkForUpdates = async () => {
      const update = updateRef.current;
      if (!update || !navigator.onLine || document.visibilityState !== 'visible' || checking) return;

      checking = true;
      try {
        const response = await fetch(update.url, { cache: 'no-store' });
        if (response.ok) await update.registration.update();
      } catch {
        // A later scheduled check can retry when the network is available.
      } finally {
        checking = false;
      }
    };

    const intervalId = window.setInterval(() => void checkForUpdates(), 60 * 60 * 1000);
    document.addEventListener('visibilitychange', checkForUpdates);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', checkForUpdates);
    };
  }, [registered]);

  useEffect(() => {
    if (needRefresh) setDismissed(false);
  }, [needRefresh]);

  if (!needRefresh || dismissed) return null;

  return (
    <aside aria-live="polite" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-primary/50 bg-panel p-4 shadow-xl print:hidden sm:inset-x-6 sm:bottom-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-100">Eine neue Version ist verfügbar. Starte die App neu, um sie zu verwenden.</p>
        <div className="flex shrink-0 gap-2">
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => void updateServiceWorker(true)}
            type="button"
          >
            App neu starten
          </button>
          <button
            className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => {
              setDismissed(true);
              setNeedRefresh(false);
            }}
            type="button"
          >
            Später
          </button>
        </div>
      </div>
    </aside>
  );
}