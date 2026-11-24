import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  size?: 'default' | 'large';
}

export function Modal({ title, onClose, children, actions, size = 'default' }: ModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      aria-labelledby={titleId}
      className={`fixed inset-0 m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] border-0 bg-transparent p-0 text-base text-white backdrop:bg-black/70 print:hidden ${size === 'large' ? 'max-w-5xl' : 'max-w-lg'}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
    >
      <section className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl border border-slate-600 bg-panel shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-700 px-5 py-4">
          <h2 className="text-lg font-semibold" id={titleId}>{title}</h2>
          <button
            aria-label={t('modal.close')}
            className="rounded-md p-1 text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-slate-200">{children}</div>
        {actions && <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-700 px-5 py-4">{actions}</footer>}
      </section>
    </dialog>
  );
}