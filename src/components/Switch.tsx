import { Icon } from './Icons';

export function Switch({ checked, onChange, label, disabled = false, variant = 'default' }: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'neutral';
}) {
  const colors = variant === 'neutral'
    ? checked ? 'border-primary bg-primary' : 'border-slate-600 bg-slate-800'
    : checked ? 'border-emerald-500 bg-emerald-700' : 'border-red-800 bg-red-950';
  const iconColor = variant === 'neutral' ? 'text-slate-800' : checked ? 'text-emerald-700' : 'text-red-700';

  return (
    <button aria-checked={checked} aria-label={label} className={`inline-flex h-8 w-[3.55rem] shrink-0 items-center rounded-full border p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${colors}`} disabled={disabled} onClick={onChange} role="switch" type="button">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} name={checked ? 'check' : 'close'} />
      </span>
    </button>
  );
}