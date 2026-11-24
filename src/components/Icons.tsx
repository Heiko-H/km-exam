import type { ReactNode } from 'react';

export type IconName = 'plus' | 'edit' | 'delete' | 'upload' | 'download' | 'play' | 'up' | 'down' | 'left' | 'right' | 'calendar' | 'check' | 'close' | 'repeat' | 'print' | 'save' | 'drag';

const paths: Record<IconName, ReactNode> = {
  plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />,
  edit: <path strokeLinecap="round" strokeLinejoin="round" d="m16.86 4.49 2.65 2.65M4 20l4.3-.9L19.5 7.9a1.87 1.87 0 0 0-2.65-2.65L5.65 16.4 4 20Z" />,
  delete: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16m-10 4v5m4-5v5M6 7l1 13h10l1-13M9 7V4h6v3" />,
  upload: <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5 5 5M4 16v4h16v-4" />,
  download: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 5-5m-5 5-5-5M4 16v4h16v-4" />,
  play: <path strokeLinecap="round" strokeLinejoin="round" d="m8 5 12 7-12 7V5Z" />,
  up: <path strokeLinecap="round" strokeLinejoin="round" d="m5 14 7-7 7 7" />,
  down: <path strokeLinecap="round" strokeLinejoin="round" d="m5 10 7 7 7-7" />,
  left: <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />,
  right: <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 10h18" /></>,
  check: <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />,
  close: <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />,
  repeat: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7v5h-5M4 17v-5h5m-5 0a8 8 0 0 1 14-5l2 2M4 15l2 2a8 8 0 0 0 14-5" />,
  print: <><path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v7H6z" /></>,
  save: <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8" />,
  drag: <><circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" /></>,
};

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{paths[name]}</svg>;
}

export function IconButton({ icon, label, onClick, className = '', disabled = false, type = 'button' }: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button aria-label={label} className={`inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-600 text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-40 ${className}`} disabled={disabled} onClick={onClick} title={label} type={type}>
      <Icon name={icon} />
    </button>
  );
}